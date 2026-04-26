import { useEffect, useRef, useState } from 'react'

import { useAddTask } from '../hooks/use-tasks'
import { cn } from '../lib/utils'
import type { TaskType } from '../types'

interface AddTaskModalProps {
  open: boolean
  defaultType: TaskType
  onClose: () => void
}

export function AddTaskModal({
  open,
  defaultType,
  onClose,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>(defaultType)
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutateAsync, isPending } = useAddTask()

  useEffect(() => {
    setType(defaultType)
  }, [defaultType])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setTitle('')
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed || isPending) return
    await mutateAsync({ title: trimmed, type })
    setTitle('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Centered dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-background px-5 pb-6 pt-5 shadow-2xl">

        <h2 className="mb-4 text-[20px] font-bold tracking-tight">
          New {type === 'task' ? 'Task' : 'Errand'}
        </h2>

        {/* Type toggle */}
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            className={cn(
              'flex-1 rounded-xl py-2.5 text-[14px] font-semibold transition-colors',
              type === 'task'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground',
            )}
            onClick={() => setType('task')}
          >
            Task
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-xl py-2.5 text-[14px] font-semibold transition-colors',
              type === 'Errand'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground',
            )}
            onClick={() => setType('Errand')}
          >
            Errand
          </button>
        </div>

        {/* Title input */}
        <input
          ref={inputRef}
          type="text"
          placeholder={
            type === 'task' ? 'What do you want to do?' : 'What errand to run?'
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mb-5 w-full rounded-xl border-none bg-secondary px-4 py-3.5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-xl border border-border py-3 text-[15px] font-semibold text-foreground transition-colors active:bg-secondary disabled:opacity-40"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-primary py-3 text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors active:bg-primary/80 disabled:opacity-40"
            onClick={handleSubmit}
            disabled={!title.trim() || isPending}
          >
            {isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
