import { Briefcase, Inbox, ListTodo } from 'lucide-react'
import {
  forwardRef,
  type KeyboardEvent,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { useAddTask } from '../hooks/use-tasks'
import { cn } from '../lib/utils'
import type { AddType } from '../types'

interface InlineAddTaskProps {
  defaultType: Exclude<AddType, 'Inbox'>
}

export interface InlineAddTaskHandle {
  focus: () => void
}

const BUTTONS: { type: AddType; label: string; Icon: typeof ListTodo }[] = [
  { type: 'task', label: 'Task', Icon: ListTodo },
  { type: 'Errand', label: 'Errand', Icon: Briefcase },
  { type: 'Inbox', label: 'Inbox', Icon: Inbox },
]

export const InlineAddTask = forwardRef<
  InlineAddTaskHandle,
  InlineAddTaskProps
>(({ defaultType }, ref) => {
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutateAsync, isPending } = useAddTask()

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }))

  const submit = async (type: AddType) => {
    const trimmed = title.trim()
    if (!trimmed || isPending) return
    await mutateAsync({ title: trimmed, type })
    setTitle('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit(defaultType)
    }
  }

  return (
    <div className="px-5 pb-3">
      <input
        ref={inputRef}
        type="text"
        autoFocus
        placeholder="Add a task, errand, or inbox item…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isPending}
        className="w-full rounded-xl border-none bg-secondary px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
      />
      <div className="mt-2 flex gap-2">
        {BUTTONS.map(({ type, label, Icon }) => {
          const isDefault = type === defaultType
          return (
            <button
              key={type}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => submit(type)}
              disabled={!title.trim() || isPending}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-semibold transition-colors disabled:opacity-40',
                isDefault
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground',
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2.2} />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
})

InlineAddTask.displayName = 'InlineAddTask'
