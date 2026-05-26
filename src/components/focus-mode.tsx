import { format } from 'date-fns'
import { ArrowLeft, ExternalLink, Flag } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { markTaskAsDoing, markTaskAsDone, markTaskAsTodo } from '../api'
import { useGraph } from '../hooks/use-graph'
import { useSetDeadline } from '../hooks/use-tasks'
import type { FocusModeProps } from '../types'

export function FocusMode({ task, onExit }: FocusModeProps) {
  const [isActing, setIsActing] = useState(false)
  const { data: graphName } = useGraph()
  const setDeadline = useSetDeadline()
  const deadlineInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    markTaskAsDoing(task.uuid).catch(console.error)
  }, [task.uuid])

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleNotDone()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

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

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (!value) {
      setDeadline.mutate({ uuid: task.uuid, date: null })
      return
    }
    const [y, m, d] = value.split('-').map(Number)
    setDeadline.mutate({ uuid: task.uuid, date: new Date(y, m - 1, d) })
  }

  const deadlineValue = task.deadline ? format(task.deadline, 'yyyy-MM-dd') : ''

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary active:bg-secondary disabled:opacity-40"
          onClick={handleNotDone}
          disabled={isActing}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {graphName && (
          <a
            href={`logseq://graph/${graphName}?block-id=${task.uuid}`}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground active:bg-secondary"
            aria-label="Open in Logseq"
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
        <button
          type="button"
          onClick={() => deadlineInputRef.current?.showPicker?.()}
          className="mt-2 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[13px] font-medium text-foreground active:bg-secondary"
        >
          <Flag className="h-3.5 w-3.5 text-accent" />
          {task.deadline
            ? `Deadline: ${format(task.deadline, 'MMM d, yyyy')}`
            : 'Set deadline'}
          <input
            ref={deadlineInputRef}
            type="date"
            value={deadlineValue}
            onChange={handleDeadlineChange}
            className="sr-only"
            aria-label="Deadline date"
          />
        </button>
        {task.deadline && (
          <button
            type="button"
            onClick={() => setDeadline.mutate({ uuid: task.uuid, date: null })}
            className="text-[12px] text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear deadline
          </button>
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
