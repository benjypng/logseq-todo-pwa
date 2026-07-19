import {
  enqueueOp,
  flushOutbox,
  listEntries,
  type OutboxEntry,
  openOutbox,
  requestForEntry,
} from './outbox'
import { describe, expect, test } from 'bun:test'

let dbCounter = 0
const freshDb = () => openOutbox(`test-outbox-${++dbCounter}`)

describe('enqueueOp / listEntries', () => {
  test('lists enqueued ops oldest-first', async () => {
    const db = await freshDb()
    await enqueueOp(db, { kind: 'add-task', title: 'b', type: 'task' }, 200)
    await enqueueOp(db, { kind: 'add-task', title: 'a', type: 'task' }, 100)

    const entries = await listEntries(db)
    expect(entries.map((e) => e.ts)).toEqual([100, 200])
    expect(entries[0].id).not.toBe(entries[1].id)
  })

  test('coalesces patch ops with the same kind and uuid, keeping latest', async () => {
    const db = await freshDb()
    await enqueueOp(db, { kind: 'set-status', uuid: 'u1', status: 'Doing' }, 1)
    await enqueueOp(db, { kind: 'set-status', uuid: 'u1', status: 'Done' }, 2)
    await enqueueOp(db, { kind: 'set-status', uuid: 'u2', status: 'Todo' }, 3)

    const entries = await listEntries(db)
    expect(entries).toHaveLength(2)
    const u1 = entries.find(
      (e) => e.op.kind === 'set-status' && e.op.uuid === 'u1',
    )
    expect(u1?.op).toEqual({ kind: 'set-status', uuid: 'u1', status: 'Done' })
  })

  test('does not coalesce ops of different kinds for the same uuid', async () => {
    const db = await freshDb()
    await enqueueOp(db, { kind: 'set-status', uuid: 'u1', status: 'Done' }, 1)
    await enqueueOp(
      db,
      { kind: 'set-scheduled', uuid: 'u1', scheduled: '2026-07-19' },
      2,
    )

    expect(await listEntries(db)).toHaveLength(2)
  })

  test('never coalesces add-task ops', async () => {
    const db = await freshDb()
    await enqueueOp(db, { kind: 'add-task', title: 'same', type: 'task' }, 1)
    await enqueueOp(db, { kind: 'add-task', title: 'same', type: 'task' }, 2)

    expect(await listEntries(db)).toHaveLength(2)
  })
})

describe('requestForEntry', () => {
  test('maps add-task to POST /task with the page derived from capture time', () => {
    const ts = new Date(2026, 6, 19, 9, 30).getTime()
    const req = requestForEntry({
      id: 'x',
      ts,
      op: { kind: 'add-task', title: 'Buy milk', type: 'Errand' },
    })
    expect(req).toEqual({
      method: 'POST',
      path: '/task',
      body: { title: 'Buy milk', type: 'Errand', page: 'Jul 19th, 2026' },
    })
  })

  test('maps set-status to PATCH /task/status', () => {
    const req = requestForEntry({
      id: 'x',
      ts: 1,
      op: { kind: 'set-status', uuid: 'u1', status: 'Done' },
    })
    expect(req).toEqual({
      method: 'PATCH',
      path: '/task/status',
      body: { uuid: 'u1', status: 'Done' },
    })
  })

  test('maps set-scheduled and set-deadline to their PATCH routes', () => {
    expect(
      requestForEntry({
        id: 'x',
        ts: 1,
        op: { kind: 'set-scheduled', uuid: 'u1', scheduled: null },
      }),
    ).toEqual({
      method: 'PATCH',
      path: '/task/scheduled',
      body: { uuid: 'u1', scheduled: null },
    })
    expect(
      requestForEntry({
        id: 'x',
        ts: 1,
        op: { kind: 'set-deadline', uuid: 'u1', deadline: '2026-08-01' },
      }),
    ).toEqual({
      method: 'PATCH',
      path: '/task/deadline',
      body: { uuid: 'u1', deadline: '2026-08-01' },
    })
  })
})

describe('flushOutbox', () => {
  test('sends oldest-first and deletes each on success', async () => {
    const db = await freshDb()
    await enqueueOp(db, { kind: 'add-task', title: 'first', type: 'task' }, 1)
    await enqueueOp(db, { kind: 'add-task', title: 'second', type: 'task' }, 2)

    const sent: OutboxEntry[] = []
    const result = await flushOutbox(db, async (entry) => {
      sent.push(entry)
    })

    expect(sent.map((e) => e.ts)).toEqual([1, 2])
    expect(result).toEqual({ sent: 2, dropped: 0 })
    expect(await listEntries(db)).toHaveLength(0)
  })

  test('halts at the first network/server failure, keeping that op and later ones', async () => {
    const db = await freshDb()
    await enqueueOp(db, { kind: 'set-status', uuid: 'u1', status: 'Done' }, 1)
    await enqueueOp(db, { kind: 'set-status', uuid: 'u2', status: 'Done' }, 2)

    const result = await flushOutbox(db, async () => {
      throw new TypeError('fetch failed')
    })

    expect(result).toEqual({ sent: 0, dropped: 0 })
    expect(await listEntries(db)).toHaveLength(2)
  })

  test('halts on a 5xx response error', async () => {
    const db = await freshDb()
    await enqueueOp(db, { kind: 'set-status', uuid: 'u1', status: 'Done' }, 1)

    await flushOutbox(db, async () => {
      throw Object.assign(new Error('server'), { status: 500 })
    })

    expect(await listEntries(db)).toHaveLength(1)
  })

  test('drops an op rejected with a 4xx and continues with the rest', async () => {
    const db = await freshDb()
    await enqueueOp(db, { kind: 'set-status', uuid: 'gone', status: 'Done' }, 1)
    await enqueueOp(db, { kind: 'set-status', uuid: 'u2', status: 'Done' }, 2)

    const sent: string[] = []
    const result = await flushOutbox(db, async (entry) => {
      const uuid = entry.op.kind === 'set-status' ? entry.op.uuid : ''
      if (uuid === 'gone') {
        throw Object.assign(new Error('not found'), { status: 404 })
      }
      sent.push(uuid)
    })

    expect(result).toEqual({ sent: 1, dropped: 1 })
    expect(sent).toEqual(['u2'])
    expect(await listEntries(db)).toHaveLength(0)
  })
})
