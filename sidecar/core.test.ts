import { createHandler } from './core'
import { describe, expect, test } from 'bun:test'

type Call = string[]

function makeHandler(respond: (args: string[]) => unknown | Promise<unknown>): {
  handler: (req: Request) => Promise<Response>
  calls: Call[]
} {
  const calls: Call[] = []
  const handler = createHandler({
    graph: 'test-graph',
    runLogseq: async (args: string[]) => {
      calls.push(args)
      return respond(args)
    },
  })
  return { handler, calls }
}

const post = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })

const patch = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })

describe('GET /graph', () => {
  test('returns the configured graph name', async () => {
    const { handler } = makeHandler(() => null)
    const res = await handler(new Request('http://localhost/graph'))
    expect(await res.json()).toEqual({ name: 'test-graph' })
  })
})

describe('POST /query', () => {
  test('normalizes block keys in results', async () => {
    const { handler } = makeHandler(() => ({
      status: 'ok',
      data: {
        result: [[{ 'block/title': 'hello', 'block/uuid': 'u1' }, 'Todo']],
      },
    }))
    const res = await handler(post('/query', { edn: '[:find ...]' }))
    expect(await res.json()).toEqual([
      [{ 'full-title': 'hello', uuid: 'u1' }, 'Todo'],
    ])
  })
})

describe('POST /task dedup', () => {
  const existingBlock = (title: string, tag: string) => ({
    status: 'ok',
    data: {
      result: [
        [{ 'block/title': title, 'block/tags': [{ 'block/title': tag }] }],
      ],
    },
  })

  test('skips the write when an identical task already exists on the page', async () => {
    const { handler, calls } = makeHandler((args) => {
      if (args[0] === 'query') return existingBlock('Buy milk', 'Task')
      throw new Error('should not upsert')
    })
    const res = await handler(
      post('/task', {
        title: 'Buy milk',
        type: 'task',
        page: 'Jul 19th, 2026',
      }),
    )
    expect(await res.json()).toEqual({ deduped: true })
    expect(calls).toHaveLength(1)
    expect(calls[0][0]).toBe('query')
  })

  test('writes when the same title exists with a different tag', async () => {
    const { handler, calls } = makeHandler((args) => {
      if (args[0] === 'query') return existingBlock('Buy milk', 'Errand')
      return { status: 'ok', data: { result: [42] } }
    })
    const res = await handler(
      post('/task', {
        title: 'Buy milk',
        type: 'task',
        page: 'Jul 19th, 2026',
      }),
    )
    expect(await res.json()).toEqual({ id: 42 })
    expect(calls.map((c) => c[0])).toEqual(['query', 'upsert'])
  })

  test('writes when no matching block exists', async () => {
    const { handler, calls } = makeHandler((args) => {
      if (args[0] === 'query') return { status: 'ok', data: { result: [] } }
      return { status: 'ok', data: { result: [7] } }
    })
    const res = await handler(
      post('/task', {
        title: 'New task',
        type: 'Errand',
        page: 'Jul 19th, 2026',
      }),
    )
    expect(await res.json()).toEqual({ id: 7 })
    expect(calls.map((c) => c[0])).toEqual(['query', 'upsert'])
  })

  test('still writes when the dedup query itself fails', async () => {
    const { handler, calls } = makeHandler((args) => {
      if (args[0] === 'query') throw new Error('query blew up')
      return { status: 'ok', data: { result: [9] } }
    })
    const res = await handler(
      post('/task', { title: 'T', type: 'task', page: 'Jul 19th, 2026' }),
    )
    expect(await res.json()).toEqual({ id: 9 })
    expect(calls.map((c) => c[0])).toEqual(['query', 'upsert'])
  })
})

describe('error mapping', () => {
  test('maps CLI not-found errors to 404', async () => {
    const { handler } = makeHandler(() => {
      throw new Error('upsert task exited 1: entity not found for uuid abc')
    })
    const res = await handler(
      patch('/task/status', { uuid: 'abc', status: 'Done' }),
    )
    expect(res.status).toBe(404)
  })

  test('maps other CLI errors to 500', async () => {
    const { handler } = makeHandler(() => {
      throw new Error('spawn failed')
    })
    const res = await handler(
      patch('/task/status', { uuid: 'abc', status: 'Done' }),
    )
    expect(res.status).toBe(500)
  })
})
