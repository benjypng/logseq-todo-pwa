import { format } from 'date-fns'
import { type IDBPDatabase, openDB } from 'idb'

import type { AddType, TaskStatus } from '../types'

export type OutboxOp =
  | { kind: 'add-task'; title: string; type: AddType }
  | { kind: 'set-status'; uuid: string; status: TaskStatus }
  | { kind: 'set-scheduled'; uuid: string; scheduled: string | null }
  | { kind: 'set-deadline'; uuid: string; deadline: string | null }

export interface OutboxEntry {
  id: string
  ts: number
  op: OutboxOp
}

export type OutboxDB = IDBPDatabase

const STORE = 'ops'

export function openOutbox(name = 'todo-outbox'): Promise<OutboxDB> {
  return openDB(name, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE, { keyPath: 'id' })
      store.createIndex('by-ts', 'ts')
    },
  })
}

export function listEntries(db: OutboxDB): Promise<OutboxEntry[]> {
  return db.getAllFromIndex(STORE, 'by-ts') as Promise<OutboxEntry[]>
}

export async function enqueueOp(
  db: OutboxDB,
  op: OutboxOp,
  ts: number,
): Promise<OutboxEntry> {
  if (op.kind !== 'add-task') {
    const existing = await listEntries(db)
    for (const entry of existing) {
      if (entry.op.kind === op.kind && entry.op.uuid === op.uuid) {
        await db.delete(STORE, entry.id)
      }
    }
  }
  const entry: OutboxEntry = { id: crypto.randomUUID(), ts, op }
  await db.put(STORE, entry)
  return entry
}

export interface OutboxRequest {
  method: 'POST' | 'PATCH'
  path: string
  body: Record<string, unknown>
}

export function requestForEntry(entry: OutboxEntry): OutboxRequest {
  const op = entry.op
  switch (op.kind) {
    case 'add-task':
      return {
        method: 'POST',
        path: '/task',
        body: {
          title: op.title,
          type: op.type,
          page: format(new Date(entry.ts), 'MMM do, yyyy'),
        },
      }
    case 'set-status':
      return {
        method: 'PATCH',
        path: '/task/status',
        body: { uuid: op.uuid, status: op.status },
      }
    case 'set-scheduled':
      return {
        method: 'PATCH',
        path: '/task/scheduled',
        body: { uuid: op.uuid, scheduled: op.scheduled },
      }
    case 'set-deadline':
      return {
        method: 'PATCH',
        path: '/task/deadline',
        body: { uuid: op.uuid, deadline: op.deadline },
      }
  }
}

function isDroppable(err: unknown): boolean {
  const status = (err as { status?: unknown })?.status
  return typeof status === 'number' && status >= 400 && status < 500
}

export async function flushOutbox(
  db: OutboxDB,
  send: (entry: OutboxEntry) => Promise<void>,
): Promise<{ sent: number; dropped: number }> {
  const pending = await listEntries(db)
  let sent = 0
  let dropped = 0
  for (const entry of pending) {
    try {
      await send(entry)
    } catch (err) {
      if (isDroppable(err)) {
        await db.delete(STORE, entry.id)
        dropped += 1
        continue
      }
      break
    }
    await db.delete(STORE, entry.id)
    sent += 1
  }
  return { sent, dropped }
}
