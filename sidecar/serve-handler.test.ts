import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createServeHandler } from './serve-handler'
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

let distDir: string

beforeAll(() => {
  const root = mkdtempSync(join(tmpdir(), 'serve-handler-'))
  distDir = join(root, 'dist')
  mkdirSync(join(distDir, 'assets'), { recursive: true })
  writeFileSync(join(distDir, 'index.html'), '<html>app shell</html>')
  writeFileSync(join(distDir, 'assets', 'app.js'), 'console.log("hi")')
  writeFileSync(join(root, 'secret.txt'), 'secret')
})

afterAll(() => {
  rmSync(join(distDir, '..'), { recursive: true, force: true })
})

function makeHandler() {
  const seen: { method: string; path: string; body: unknown }[] = []
  const handler = createServeHandler({
    distDir,
    apiHandler: async (req: Request) => {
      const url = new URL(req.url)
      seen.push({
        method: req.method,
        path: url.pathname + url.search,
        body: req.method === 'GET' ? null : await req.json(),
      })
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    },
  })
  return { handler, seen }
}

describe('/logseq-cli routing', () => {
  test('strips the prefix before delegating to the api handler', async () => {
    const { handler, seen } = makeHandler()
    const res = await handler(
      new Request('http://localhost:5175/logseq-cli/graph'),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(seen).toEqual([{ method: 'GET', path: '/graph', body: null }])
  })

  test('preserves method and body', async () => {
    const { handler, seen } = makeHandler()
    await handler(
      new Request('http://localhost:5175/logseq-cli/task/status', {
        method: 'PATCH',
        body: JSON.stringify({ uuid: 'u1', status: 'Done' }),
      }),
    )
    expect(seen).toEqual([
      {
        method: 'PATCH',
        path: '/task/status',
        body: { uuid: 'u1', status: 'Done' },
      },
    ])
  })

  test('maps the bare prefix to /', async () => {
    const { handler, seen } = makeHandler()
    await handler(new Request('http://localhost:5175/logseq-cli'))
    expect(seen[0].path).toBe('/')
  })

  test('does not treat prefix-lookalike paths as api routes', async () => {
    const { handler, seen } = makeHandler()
    const res = await handler(new Request('http://localhost:5175/logseq-cliff'))
    expect(seen).toHaveLength(0)
    expect(await res.text()).toBe('<html>app shell</html>')
  })
})

describe('static serving', () => {
  test('serves files that exist in dist', async () => {
    const { handler } = makeHandler()
    const res = await handler(
      new Request('http://localhost:5175/assets/app.js'),
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('console.log("hi")')
  })

  test('serves index.html at the root', async () => {
    const { handler } = makeHandler()
    const res = await handler(new Request('http://localhost:5175/'))
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<html>app shell</html>')
  })

  test('falls back to index.html for unknown navigation paths', async () => {
    const { handler } = makeHandler()
    const res = await handler(new Request('http://localhost:5175/focus'))
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<html>app shell</html>')
  })

  test('rejects encoded path traversal outside dist', async () => {
    const { handler } = makeHandler()
    const res = await handler(
      new Request('http://localhost:5175/%2e%2e/secret.txt'),
    )
    expect(await res.text()).not.toBe('secret')
  })

  test('returns 404 for non-GET requests to static paths', async () => {
    const { handler } = makeHandler()
    const res = await handler(
      new Request('http://localhost:5175/anything', { method: 'POST' }),
    )
    expect(res.status).toBe(404)
  })
})
