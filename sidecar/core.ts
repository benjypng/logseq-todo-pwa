export type RunLogseq = (args: string[]) => Promise<unknown>

export interface HandlerDeps {
  graph: string
  runLogseq: RunLogseq
}

// Normalize CLI JSON keys to match the legacy HTTP-API shape the PWA expects.
// - `block/title` -> `full-title`
// - `block/X` -> `X` (e.g. `block/uuid`, `block/page`, `block/journal-day`)
// - `logseq.property/X` -> `:logseq.property/X` (preserves colon-prefix lookups)
export function normalize(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(normalize)
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      let nk = k
      if (k === 'block/title') nk = 'full-title'
      else if (k.startsWith('block/')) nk = k.slice('block/'.length)
      else if (k.startsWith('logseq.property/')) nk = `:${k}`
      out[nk] = normalize(val)
    }
    return out
  }
  return v
}

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  })
}

function fail(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const NOT_FOUND_PATTERN = /not found|no entity|does not exist|unknown uuid/i

interface PageBlock {
  'block/title'?: string
  'block/tags'?: { 'block/title'?: string }[]
}

async function findDuplicateOnPage(
  runLogseq: RunLogseq,
  page: string,
  title: string,
  tag: string,
): Promise<boolean> {
  const edn = `[:find (pull ?b [:block/title {:block/tags [:block/title]}]) :where [?p :block/name "${page.toLowerCase()}"] [?b :block/page ?p]]`
  try {
    const raw = (await runLogseq(['query', '--query', edn])) as {
      data?: { result?: unknown[] }
    } | null
    const blocks = (raw?.data?.result ?? []).flat() as PageBlock[]
    return blocks.some(
      (b) =>
        b['block/title'] === title &&
        (b['block/tags'] ?? []).some((t) => t['block/title'] === tag),
    )
  } catch {
    return false
  }
}

export function createHandler({ graph, runLogseq }: HandlerDeps) {
  return async function handle(req: Request): Promise<Response> {
    const url = new URL(req.url)
    try {
      // GET /graph -> { name }
      if (req.method === 'GET' && url.pathname === '/graph') {
        return ok({ name: graph })
      }

      // GET /sync/status -> { state: 'synced'|'pending'|'error', detail, error? }
      // Derives a traffic-light verdict from `logseq sync status`:
      //   error   - CLI failed, status != ok, last-error set, or ws not open
      //   pending - any pending-* counter > 0, or local-tx != remote-tx
      //   synced  - connected, no errors, nothing pending, txs converged
      if (req.method === 'GET' && url.pathname === '/sync/status') {
        try {
          const raw = (await runLogseq(['sync', 'status'])) as {
            status?: string
            data?: {
              'ws-state'?: string
              'last-error'?: unknown
              'pending-local'?: number
              'pending-server'?: number
              'pending-asset'?: number
              'local-tx'?: number
              'remote-tx'?: number
            }
          } | null
          const d = raw?.data
          let state: 'synced' | 'pending' | 'error'
          if (
            !d ||
            raw?.status !== 'ok' ||
            d['last-error'] != null ||
            d['ws-state'] !== 'open'
          ) {
            state = 'error'
          } else if (
            (d['pending-local'] ?? 0) > 0 ||
            (d['pending-server'] ?? 0) > 0 ||
            (d['pending-asset'] ?? 0) > 0 ||
            d['local-tx'] !== d['remote-tx']
          ) {
            state = 'pending'
          } else {
            state = 'synced'
          }
          return ok({ state, detail: d ?? null })
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          return ok({ state: 'error', detail: null, error: message })
        }
      }

      // POST /query  body: { edn: "[:find ... :where ...]" }
      if (req.method === 'POST' && url.pathname === '/query') {
        const { edn } = (await req.json()) as { edn: string }
        if (!edn) return fail(400, 'missing edn')
        const raw = (await runLogseq(['query', '--query', edn])) as {
          status: string
          data: { result?: unknown }
        } | null
        return ok(normalize(raw?.data?.result ?? []))
      }

      // PATCH /task/status  body: { uuid, status }
      if (req.method === 'PATCH' && url.pathname === '/task/status') {
        const { uuid, status } = (await req.json()) as {
          uuid: string
          status: string
        }
        await runLogseq(['upsert', 'task', '--uuid', uuid, '--status', status])
        return ok({ ok: true })
      }

      // PATCH /task/scheduled  body: { uuid, scheduled: "YYYY-MM-DD" | null }
      if (req.method === 'PATCH' && url.pathname === '/task/scheduled') {
        const { uuid, scheduled } = (await req.json()) as {
          uuid: string
          scheduled: string | null
        }
        const args = ['upsert', 'task', '--uuid', uuid]
        if (scheduled === null) args.push('--no-scheduled')
        else args.push('--scheduled', scheduled)
        await runLogseq(args)
        return ok({ ok: true })
      }

      // PATCH /task/deadline  body: { uuid, deadline: "YYYY-MM-DD" | null }
      if (req.method === 'PATCH' && url.pathname === '/task/deadline') {
        const { uuid, deadline } = (await req.json()) as {
          uuid: string
          deadline: string | null
        }
        const args = ['upsert', 'task', '--uuid', uuid]
        if (deadline === null) args.push('--no-deadline')
        else args.push('--deadline', deadline)
        await runLogseq(args)
        return ok({ ok: true })
      }

      // POST /task  body: { title, type: "task"|"Errand"|"Inbox", page }
      // Uses `upsert block` (not `upsert task`) so the block carries only
      // the requested tag — `upsert task` always attaches the Task tag,
      // which would double-tag Errands and surface them in the Tasks list.
      if (req.method === 'POST' && url.pathname === '/task') {
        const { title, type, page } = (await req.json()) as {
          title: string
          type: 'task' | 'Errand' | 'Inbox'
          page: string
        }
        const tag =
          type === 'Errand' ? 'Errand' : type === 'Inbox' ? 'Inbox' : 'Task'
        if (await findDuplicateOnPage(runLogseq, page, title, tag)) {
          return ok({ deduped: true })
        }
        const created = (await runLogseq([
          'upsert',
          'block',
          '--content',
          title,
          '--target-page',
          page,
          '--update-tags',
          `["${tag}"]`,
        ])) as { status: string; data: { result?: unknown[] } } | null
        const newId = created?.data?.result?.[0] as number | undefined
        return ok({ id: newId ?? null })
      }

      return fail(404, 'not found')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(message)
      return fail(NOT_FOUND_PATTERN.test(message) ? 404 : 500, message)
    }
  }
}
