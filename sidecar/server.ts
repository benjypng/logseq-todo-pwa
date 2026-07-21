import { createHandler } from './core'
import { makeRunLogseq, requireGraph } from './logseq'

const PORT = Number(process.env.SIDECAR_PORT ?? 12316)
const GRAPH = requireGraph()

Bun.serve({
  port: PORT,
  fetch: createHandler({ graph: GRAPH, runLogseq: makeRunLogseq(GRAPH) }),
})

console.log(
  `logseq sidecar listening on http://127.0.0.1:${PORT} (graph=${GRAPH})`,
)
