import { X } from 'lucide-react'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'

import { useAddTask } from '../hooks/use-tasks'
import { cn } from '../lib/utils'
import type { AddType } from '../types'

interface AddComposerProps {
  open: boolean
  onClose: () => void
  onSubmitted?: (type: AddType) => void
}

const FLAVOURS: {
  type: AddType
  label: string
  shapeClass: string
  shadow: string
}[] = [
  {
    type: 'task',
    label: 'Task',
    shapeClass: 'rounded-full bg-accent',
    shadow: '4px 4px 0 0 #FF3D8B',
  },
  {
    type: 'Errand',
    label: 'Errand',
    shapeClass: 'rounded-[8px] bg-tangerine',
    shadow: '4px 4px 0 0 #FF9F1C',
  },
  {
    type: 'Inbox',
    label: 'Inbox',
    shapeClass: 'rounded-[50%_50%_46%_46%] bg-grape',
    shadow: '4px 4px 0 0 #6A5CFF',
  },
]

export function AddComposer({ open, onClose, onSubmitted }: AddComposerProps) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const addTask = useAddTask()

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
    setDraft('')
  }, [open])

  if (!open) return null

  const canSubmit = !!draft.trim()

  const submit = async (type: AddType) => {
    if (!canSubmit) return
    await addTask(draft.trim(), type)
    onSubmitted?.(type)
    setDraft('')
    onClose()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit('task')
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="absolute inset-0 z-[5] cursor-default bg-[rgba(42,27,61,0.55)]"
        style={{ animation: 'candyScrimIn .2s ease' }}
      />

      <div
        className="absolute inset-x-0 bottom-0 z-[6] flex flex-col gap-4 rounded-t-[36px] border-t-4 border-ink bg-background px-[22px] pt-[22px]"
        style={{
          paddingBottom: 'calc(30px + env(safe-area-inset-bottom))',
          animation: 'candySheetUp .28s cubic-bezier(.22,1.2,.36,1)',
        }}
      >
        <div className="flex items-center">
          <span className="whitespace-nowrap font-display text-[28px] font-semibold text-ink">
            Feed me a task
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="ml-auto flex h-[38px] w-[38px] items-center justify-center rounded-full border-[3px] border-ink bg-card text-ink"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2.6} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What are we chewing on?"
          className="w-full rounded-[20px] border-[3px] border-ink bg-card px-[18px] py-4 text-[17px] font-bold text-ink shadow-[4px_4px_0_0_#FF3D8B] outline-none placeholder:text-muted-foreground"
        />

        <div className="flex flex-col gap-[9px]">
          <span className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
            Pick a flavour
          </span>
          <div className="grid grid-cols-3 gap-[10px]">
            {FLAVOURS.map(({ type, label, shapeClass, shadow }) => (
              <button
                key={type}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => submit(type)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-[22px] border-[3px] border-ink bg-card py-4 font-display text-[16px] font-semibold text-ink transition-opacity',
                  !canSubmit && 'opacity-40',
                )}
                style={{ boxShadow: shadow }}
              >
                <span
                  className={cn('h-7 w-7 border-[3px] border-ink', shapeClass)}
                />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
