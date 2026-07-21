import { spawn } from 'bun'

import type { RunLogseq } from './core'

export function requireGraph(): string {
  const graph = process.env.LOGSEQ_GRAPH
  if (!graph) {
    console.error(
      'LOGSEQ_GRAPH env var is required (set it in .env.development or your shell)',
    )
    process.exit(1)
  }
  return graph
}

export function makeRunLogseq(graph: string): RunLogseq {
  return async function runLogseq(args: string[]): Promise<unknown> {
    const proc = spawn(['logseq', ...args, '-g', graph, '-o', 'json'], {
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
}
