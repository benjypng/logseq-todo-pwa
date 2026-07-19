# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
bun run dev              # Start dev server
bun run dev -- --host    # Expose to local network/VPN
bun run sidecar          # Start the CLI sidecar (requires LOGSEQ_GRAPH)
bun run start            # Sidecar + dev server together
bun run build            # Production build
bun test                 # Unit tests (outbox, merge, persister, sidecar core)
bun run lint:precommit   # Run biome check and tsc (also runs on pre-commit)
```

## Architecture Overview

This is an offline-first React PWA that manages Logseq tasks through a local sidecar server (`sidecar/`, Bun, port 12316) that shells out to the `logseq` CLI. See `SIDECAR_ARCHITECTURE.md` for the sidecar pattern.

**UI Layer → Hooks → Outbox/Query cache → Sidecar → logseq CLI**

- **Components** (`src/components/`): React components (Radix primitives + Tailwind)
- **Hooks** (`src/hooks/`): TanStack React Query for reads; all writes enqueue to the outbox
- **API** (`src/api.ts`): Wretch client for `/logseq-cli` (Vite-proxied to the sidecar)

### Offline-first design

- Reads: the React Query cache for `['tasks']` and `['graph']` is persisted to IndexedDB (`src/lib/persister.ts`, wired in `src/main.tsx`), so the last-known list renders offline. Reads use `retry: false` and fail fast.
- Writes: every mutation is enqueued to an IndexedDB outbox (`src/lib/outbox.ts`) via `OutboxProvider` (`src/hooks/use-outbox.tsx`), which flushes oldest-first on enqueue, on mount, every 20s, and on the browser `online` event. A network/5xx failure halts the queue (retried later); a 4xx drops the op and continues.
- Pending ops are overlaid on the cached task list by `src/lib/merge.ts` (queued Done hides the task, queued adds render as pending rows).
- Idempotency: PATCH ops are absolute-value by uuid; the sidecar dedupes `POST /task` by identical title+tag on the target page.
- The service worker precaches the app shell; `/logseq-cli` is deliberately NetworkOnly (durability lives in the outbox, not Workbox).

### Key Data Flow

1. Vite proxies `/logseq-cli` to `http://127.0.0.1:12316` (the sidecar; start with `bun run sidecar` or `bun run start`)
2. React Query polls every 2 seconds with aggressive refetch on focus/reconnect (polling pauses automatically while offline)
3. Datascript queries in `src/constants.ts` define what data to fetch from Logseq

### Core Files

- `src/constants.ts` - Datascript queries (`GET_TASKS_FROM_LOGSEQ`, `GET_ERRANDS_FROM_LOGSEQ`)
- `src/hooks/use-tasks.ts` - `useTasks` (query + outbox overlay), `useAddTask`, `useSetStatus`, `useToggleScheduleToday`, `useSetDeadline`
- `src/lib/outbox.ts` / `src/lib/merge.ts` / `src/lib/persister.ts` - offline core (unit-tested with `bun test`)
- `sidecar/core.ts` - pure request handler (tested); `sidecar/server.ts` - boot + CLI spawn
- `src/types.ts` - TypeScript interfaces for `LogseqTask`, `Task`, `TaskStatus`, `Priority`, `TaskType`
- `src/App.tsx` - list/focus mode switch

### Task Status Flow

Todo → Doing → Done (Waiting is filtered out)

### Keyboard Shortcuts (in Focus Mode)

- `a` - Add task modal
- `d` - Mark task as done
- `Escape` - Close focus mode

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Radix UI primitives** + **Tailwind CSS** for UI
- **TanStack React Query** (+ persist-client) for server state
- **idb** for the IndexedDB outbox and query-cache persistence
- **Wretch** for HTTP requests
- **Biome** for linting/formatting (replaces ESLint + Prettier)
- **Bun** for the sidecar server and test runner

## Environment Variables

```
LOGSEQ_GRAPH=your_graph_name    # read by the sidecar
ALLOWED_HOSTS=                  # optional, for LAN/VPN access via Vite
```
