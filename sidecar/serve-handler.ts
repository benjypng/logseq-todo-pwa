import { join, normalize, resolve, sep } from 'node:path'

const API_PREFIX = '/logseq-cli'

export interface ServeHandlerDeps {
  apiHandler: (req: Request) => Promise<Response>
  distDir: string
}

export function createServeHandler({ apiHandler, distDir }: ServeHandlerDeps) {
  const root = resolve(distDir)
  const indexFile = join(root, 'index.html')

  return async function handle(req: Request): Promise<Response> {
    const url = new URL(req.url)

    if (
      url.pathname === API_PREFIX ||
      url.pathname.startsWith(`${API_PREFIX}/`)
    ) {
      const stripped = url.pathname.slice(API_PREFIX.length) || '/'
      url.pathname = stripped
      return apiHandler(new Request(url, req))
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return new Response('not found', { status: 404 })
    }

    const requestPath = normalize(decodeURIComponent(url.pathname))
    const candidate = resolve(join(root, requestPath))
    if (candidate === root || candidate.startsWith(root + sep)) {
      const file = Bun.file(candidate === root ? indexFile : candidate)
      if (await file.exists()) {
        return new Response(file)
      }
    }

    return new Response(Bun.file(indexFile), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}
