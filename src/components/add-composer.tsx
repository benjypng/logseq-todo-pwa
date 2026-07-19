import { Briefcase, Inbox, ListTodo, X } from 'lucide-react'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'

import { useAddTask } from '../hooks/use-tasks'
import { cn } from '../lib/utils'
import type { AddType } from '../types'

interface AddComposerProps {
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
}

const DESTINATIONS: { type: AddType; label: string; Icon: typeof ListTodo }[] =
  [
    { type: 'task', label: 'Task', Icon: ListTodo },
    { type: 'Errand', label: 'Errand', Icon: Briefcase },
    { type: 'Inbox', label: 'Inbox', Icon: Inbox },
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
    onSubmitted?.()
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
        className="absolute inset-0 z-[5] cursor-default bg-[rgba(20,16,8,0.32)]"
        style={{ animation: 'annadoScrimIn .2s ease' }}
      />

      <div
        className="absolute inset-x-0 bottom-0 z-[6] flex flex-col gap-4 rounded-t-[28px] bg-background px-[22px] pt-6"
        style={{
          paddingBottom: 'calc(22px + env(safe-area-inset-bottom))',
          boxShadow: '0 -18px 50px rgba(20,16,8,.22)',
          animation: 'annadoSheetUp .32s cubic-bezier(.22,1,.36,1)',
        }}
      >
        <div className="flex items-center">
          <span className="whitespace-nowrap font-serif text-[26px] text-foreground">
            New item
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="ml-auto inline-flex text-muted-foreground"
          >
            <X className="h-[22px] w-[22px]" strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-accent bg-field px-5 py-[18px]">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs doing?"
            className="min-w-0 flex-1 border-none bg-transparent text-[16.5px] font-[450] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-[9px]">
          <span className="text-[12.5px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
            {canSubmit ? 'Add as' : 'Type something, then pick a type'}
          </span>
          <div className="flex gap-2.5">
            {DESTINATIONS.map(({ type, label, Icon }) => (
              <button
                key={type}
                type="button"
                disabled={!canSubmit}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => submit(type)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-2 rounded-2xl border-[1.5px] border-transparent bg-seg-idle px-1.5 py-[18px] text-[14.5px] font-semibold transition-[background-color,border-color,transform] duration-150 active:scale-[0.96]',
                  canSubmit
                    ? 'cursor-pointer text-foreground hover:border-accent hover:bg-accent-soft hover:text-accent'
                    : 'cursor-default text-muted-foreground opacity-50',
                )}
              >
                <Icon className="h-[23px] w-[23px]" strokeWidth={1.8} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
