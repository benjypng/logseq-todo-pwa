import { fileURLToPath } from 'node:url'

import { createHandler } from './core'
import { makeRunLogseq, requireGraph } from './logseq'
import { createServeHandler } from './serve-handler'

const PORT = Number(process.env.PORT ?? 5175)
const GRAPH = requireGraph()
const DIST_DIR = fileURLToPath(new URL('../dist', import.meta.url))

Bun.serve({
  port: PORT,
  fetch: createServeHandler({
    apiHandler: createHandler({
      graph: GRAPH,
      runLogseq: makeRunLogseq(GRAPH),
    }),
    distDir: DIST_DIR,
  }),
})

console.log(
  `logseq-todo serving ${DIST_DIR} on http://0.0.0.0:${PORT} (graph=${GRAPH})`,
)
