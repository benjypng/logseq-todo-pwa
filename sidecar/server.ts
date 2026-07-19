import { spawn } from 'bun'

import { createHandler } from './core'

const PORT = Number(process.env.SIDECAR_PORT ?? 12316)
const GRAPH = process.env.LOGSEQ_GRAPH
if (!GRAPH) {
  console.error(
    'LOGSEQ_GRAPH env var is required (set it in .env.development or your shell)',
  )
  process.exit(1)
}

async function runLogseq(args: string[]): Promise<unknown> {
  const proc = spawn(['logseq', ...args, '-g', GRAPH, '-o', 'json'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  if (exitCode !== 0) {
    throw new Error(
      `logseq ${args.join(' ')} exited ${exitCode}: ${stderr || stdout}`,
    )
  }
  const trimmed = stdout.trim()
  if (!trimmed) return null
  return JSON.parse(trimmed)
}

Bun.serve({
  port: PORT,
  fetch: createHandler({ graph: GRAPH, runLogseq }),
})

console.log(
  `logseq sidecar listening on http://127.0.0.1:${PORT} (graph=${GRAPH})`,
)
