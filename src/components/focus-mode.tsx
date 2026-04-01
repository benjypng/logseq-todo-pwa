import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'

import { markTaskAsDoing, markTaskAsDone, markTaskAsTodo } from '../api'
import { useGraph } from '../hooks/use-graph'
import type { Task } from '../types'

interface FocusModeProps {
  task: Task
  onExit: () => void
}

export function FocusMode({ task, onExit }: FocusModeProps) {
  const [isActing, setIsActing] = useState(false)
  const { data: graphName } = useGraph()

  useEffect(() => {
    markTaskAsDoing(task.uuid).catch(console.error)
  }, [task.uuid])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleNotDone()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const handleNotDone = () => {
    if (isActing) return
    setIsActing(true)
    markTaskAsTodo(task.uuid)
      .catch(console.error)
      .finally(() => {
        setIsActing(false)
        onExit()
      })
  }

  const handleComplete = () => {
    if (isActing) return
    setIsActing(true)
    markTaskAsDone(task.uuid)
      .catch(console.error)
      .finally(() => {
        setIsActing(false)
        onExit()
      })
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary active:bg-secondary disabled:opacity-40"
          onClick={handleNotDone}
          disabled={isActing}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {graphName && (
          <a
            href={`logseq://graph/${graphName}?block-id=${task.uuid}`}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground active:bg-secondary"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Centered content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-foreground">
          {task.displayText}
        </h1>
        {task.pageName && task.pageName !== 'Unknown' && (
          <p className="text-[14px] text-muted-foreground">{task.pageName}</p>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex gap-3 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="flex-1 rounded-2xl border border-border py-3.5 text-[15px] font-semibold text-foreground transition-colors active:bg-secondary disabled:opacity-40"
          onClick={handleNotDone}
          disabled={isActing}
        >
          Not Done
        </button>
        <button
          type="button"
          className="flex-1 rounded-2xl bg-primary py-3.5 text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors active:bg-primary/80 disabled:opacity-40"
          onClick={handleComplete}
          disabled={isActing}
        >
          Complete
        </button>
      </div>
    </div>
  )
}
