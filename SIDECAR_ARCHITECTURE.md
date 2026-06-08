# Logseq PWA — Sidecar Architecture (reference for new PWAs)

This describes how a browser PWA talks to a local Logseq **DB-version** graph via
the `logseq` CLI, using a small local HTTP **sidecar** as the bridge. The HTTP-API
(Logseq GUI plugin server on port 12315) approach is intentionally **not** used
here — the sidecar + CLI is the canonical path.

## Why a sidecar at all

A browser cannot spawn processes. The `logseq` CLI is a local binary that reads and
writes the graph. So we run a tiny long-lived HTTP server (the "sidecar") in Bun
that shells out to `logseq` and returns JSON. The PWA only ever speaks plain
`fetch`/HTTP to the sidecar; the sidecar owns all CLI invocation.

```
Browser PWA  ──fetch──>  Vite dev proxy (/logseq-cli)  ──>  Sidecar (Bun :12316)  ──spawn──>  logseq CLI  ──>  graph
```

Three moving parts:
1. **Sidecar** (`sidecar/server.ts`) — Bun HTTP server, spawns `logseq`, normalizes JSON.
2. **Vite proxy** — maps `/logseq-cli/*` → `http://127.0.0.1:12316/*` so the PWA uses same-origin relative URLs (no CORS).
3. **Client API module** (`src/api-cli.ts`) — thin `wretch` wrapper over the sidecar endpoints.

## 1. The sidecar (`sidecar/server.ts`)

A single `Bun.serve({ port })` with a hand-rolled router. Key pieces:

**Spawn helper** — every endpoint goes through one function that runs the CLI with
`-g <graph> -o json`, collects stdout/stderr, throws on non-zero exit, and
`JSON.parse`s the output:

```ts
import { spawn } from 'bun'
const GRAPH = process.env.LOGSEQ_GRAPH   // required; fail fast at boot if missing

async function runLogseq(args: string[]): Promise<unknown> {
  const proc = spawn(['logseq', ...args, '-g', GRAPH, '-o', 'json'], {
    stdout: 'pipe', stderr: 'pipe',
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  if (exitCode !== 0) throw new Error(`logseq ${args.join(' ')} exited ${exitCode}: ${stderr || stdout}`)
  const trimmed = stdout.trim()
  return trimmed ? JSON.parse(trimmed) : null
}
```

**Endpoints** (all return `application/json`):

| Method | Path              | CLI call                                                              | Purpose |
|--------|-------------------|----------------------------------------------------------------------|---------|
| GET    | `/graph`          | (none — echoes `LOGSEQ_GRAPH`)                                        | report active graph name |
| GET    | `/sync/status`    | `logseq sync status`                                                  | traffic-light sync state |
| POST   | `/query`          | `logseq query --query <edn>`                                          | run a Datalog query |
| PATCH  | `/task/status`    | `logseq upsert task --uuid <u> --status <s>`                          | change status |
| PATCH  | `/task/scheduled` | `logseq upsert task --uuid <u> --scheduled <d>` / `--no-scheduled`    | set/clear scheduled date |
| PATCH  | `/task/deadline`  | `logseq upsert task --uuid <u> --deadline <d>` / `--no-deadline`      | set/clear deadline |
| POST   | `/task`           | `logseq upsert block --content <t> --target-page <p> --update-tags '["Tag"]'` | create a tagged block |

Adapt these endpoints to your own domain — they are just thin verbs over
`logseq query` (reads) and `logseq upsert block|task` (writes).

**Two write primitives, and when to use which:**
- `upsert task` always attaches the built-in `Task` tag. Use it for actual tasks.
- `upsert block` carries only the tags you pass in `--update-tags`. Use it when you
  want a block tagged with something *other* than `Task` (e.g. `Errand`, `Inbox`),
  otherwise you double-tag and the item leaks into the tasks list.

**JSON normalization is the subtle part.** The CLI emits Datascript-shaped keys
(`block/title`, `block/uuid`, `logseq.property/scheduled`). The sidecar rewrites
them before returning so the client sees flatter, stable keys. The exact mapping
here was chosen to match a legacy shape — **for a new PWA, pick whatever client
shape you like and normalize to it in one place.** The recursive normalizer:

```ts
function normalize(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(normalize)
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(v)) {
      let nk = k
      if (k === 'block/title') nk = 'full-title'
      else if (k.startsWith('block/')) nk = k.slice(6)              // block/uuid -> uuid
      else if (k.startsWith('logseq.property/')) nk = `:${k}`       // keep colon-prefixed property lookups
      out[nk] = normalize(val)
    }
    return out
  }
  return v
}
```

**Sync status** deserves a note: it maps `logseq sync status` (a DB-sync-only
concept) into a 3-state verdict the UI can render as a light:
- `error` — CLI failed, `status != ok`, `last-error` set, or websocket not `open`
- `pending` — any `pending-local/server/asset` counter > 0, or `local-tx != remote-tx`
- `synced` — connected, no errors, nothing pending, txs converged

It catches its own errors and returns `{ state: 'error' }` rather than a 500, so a
flaky CLI call never breaks the UI.

## 2. Vite proxy (`vite.config.ts`)

The PWA calls relative URLs like `/logseq-cli/query`; Vite forwards them to the
sidecar. This keeps everything same-origin (no CORS, no hardcoded host) and lets a
service worker treat them as network-only.

```ts
server: {
  host: true,                  // expose on LAN/VPN
  allowedHosts,                // from ALLOWED_HOSTS env, comma-separated
  proxy: {
    '/logseq-cli': {
      target: 'http://127.0.0.1:12316',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/logseq-cli/, ''),
    },
  },
},
```

PWA/service-worker note — never cache the API calls:

```ts
VitePWA({
  workbox: {
    navigateFallbackDenylist: [/^\/logseq-cli/],
    runtimeCaching: [{
      urlPattern: ({ url }) => url.pathname.startsWith('/logseq-cli'),
      handler: 'NetworkOnly',
    }],
  },
})
```

## 3. Client API module (`src/api-cli.ts`)

A thin `wretch` client. One base URL constant, one `runQuery` helper for reads,
small functions for writes. No CLI knowledge leaks into components.

```ts
const api = wretch().url('/logseq-cli').headers({ 'Content-Type': 'application/json' })

const runQuery = (edn: string) => api.url('/query').post({ edn }).json()
const setStatus = (uuid: string, status: string) => api.url('/task/status').patch({ uuid, status }).res()
```

Consumers are TanStack React Query hooks. Reads poll + refetch on focus/reconnect;
writes are mutations that invalidate the read query. Because each sidecar call
spawns a `logseq` process, **poll gently** — e.g. sync status uses
`refetchInterval: 30_000`, `staleTime: 10_000`, `retry: false`.

## 4. Running both processes together

The sidecar and Vite are separate processes; `package.json` wires them so one
command runs both and kills the sidecar on exit:

```jsonc
"scripts": {
  "dev": "bunx vite",
  "sidecar": "bun run sidecar/server.ts",
  "start": "bun run sidecar & SIDECAR_PID=$!; trap 'kill $SIDECAR_PID 2>/dev/null' EXIT INT TERM; bun run dev"
}
```

`bun run start` is the dev entrypoint.

## 5. Environment

```
LOGSEQ_GRAPH=my-graph     # required — the sidecar refuses to boot without it
ALLOWED_HOSTS=            # optional, comma-separated hostnames for LAN/VPN access
VITE_AUTH_HASH=           # optional — SHA-256 of an unlock passphrase to gate the PWA
```

(The old HTTP backend needed `VITE_LOGSEQ_TOKEN`; the sidecar path does not.)

## Checklist for a new PWA on this pattern

1. Pick the CLI verbs your domain needs (`logseq query` for reads; `logseq upsert
   block`/`task` for writes — check `logseq <cmd> --help`).
2. Write a sidecar with one `runLogseq` spawn helper + one endpoint per verb.
3. Decide your client JSON shape and normalize CLI output to it in the sidecar.
4. Add the Vite `/logseq-cli` proxy and the network-only service-worker rule.
5. Write a thin `wretch` API module and drive it from React Query hooks (poll gently).
6. Wire a `start` script that runs sidecar + Vite together.
```
