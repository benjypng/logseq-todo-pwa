import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'

import { markTaskAsDoing, markTaskAsDone, markTaskAsTodo } from '../api'
import { useGraph } from '../hooks/use-graph'
import type { Task } from '../types'
import { Button } from './ui/button'

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
    <div className="flex h-dvh flex-col px-6 py-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNotDone}
          disabled={isActing}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {graphName && (
          <a
            href={`logseq://graph/${graphName}?block-id=${task.uuid}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <h1 className="text-2xl font-semibold leading-snug">
          {task.displayText}
        </h1>
        {task.pageName && task.pageName !== 'Unknown' && (
          <p className="text-sm text-muted-foreground">{task.pageName}</p>
        )}
      </div>

      <div className="flex gap-3 pb-6">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleNotDone}
          disabled={isActing}
        >
          Not Done
        </Button>
        <Button className="flex-1" onClick={handleComplete} disabled={isActing}>
          Complete Task
        </Button>
      </div>
    </div>
  )
}
