import { useEffect, useRef, useState } from 'react'

import { useAddTask } from '../hooks/use-tasks'
import { cn } from '../lib/utils'
import type { TaskType } from '../types'
import { Button } from './ui/button'

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

  // Sync type when defaultType changes (section switch)
  useEffect(() => {
    setType(defaultType)
  }, [defaultType])

  // Auto-focus input when modal opens
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
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="relative rounded-t-2xl bg-background px-5 pb-10 pt-5 shadow-xl">
        {/* Drag handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />

        <h2 className="mb-5 text-lg font-semibold">New item</h2>

        {/* Type toggle */}
        <div className="mb-5 flex gap-2">
          <button
            type="button"
            className={cn(
              'flex-1 rounded-lg border py-3 text-base font-medium transition-colors',
              type === 'task'
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground',
            )}
            onClick={() => setType('task')}
          >
            Task
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-lg border py-3 text-base font-medium transition-colors',
              type === 'Errand'
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground',
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
            type === 'task' ? 'Task description…' : 'Errand description…'
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mb-5 w-full rounded-lg border border-input bg-background px-3 py-3 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 py-3 text-base"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 py-3 text-base"
            onClick={handleSubmit}
            disabled={!title.trim() || isPending}
          >
            {isPending ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  )
}
