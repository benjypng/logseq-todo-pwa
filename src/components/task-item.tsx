import { CalendarOff, Sun } from 'lucide-react'
import { Fragment, type ReactNode, useRef, useState } from 'react'

import { cn } from '../lib/utils'
import type { TaskItemProps } from '../types'

const SWIPE_THRESHOLD = 80
const MAX_SWIPE = 120
const AXIS_LOCK_PX = 6

const WIKI_LINK_RE = /(\[\[[^\]]+\]\])/g

function renderTitle(text: string): ReactNode {
  const parts = text.split(WIKI_LINK_RE).filter(Boolean)
  return parts.map((part, i) =>
    part.startsWith('[[') && part.endsWith(']]') ? (
      <span key={i} className="text-ref">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}

function CheckCircle({
  done,
  disabled,
  onToggle,
}: {
  done: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className="-m-1.5 flex h-11 w-11 shrink-0 items-center justify-center"
      disabled={disabled}
      onClick={onToggle}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={done ? 'Mark task not done' : 'Mark task done'}
      aria-pressed={done}
    >
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-ink',
          done ? 'bg-mint shadow-[0_0_0_4px_rgba(46,230,168,0.3)]' : 'bg-card',
        )}
      >
        {done && (
          <span
            className="mb-[3px] h-[6px] w-[11px] -rotate-45 border-b-[3px] border-l-[3px] border-ink"
            style={{ animation: 'candyPop 0.3s ease-out' }}
          />
        )}
      </span>
    </button>
  )
}

export function TaskItem({
  task,
  done,
  whenLabel,
  onToggle,
  onToggleToday,
  onEnterFocus,
  isNew,
}: TaskItemProps) {
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const axisLocked = useRef<'x' | 'y' | null>(null)
  const didSwipe = useRef(false)
  const rowRef = useRef<HTMLDivElement>(null)

  const reset = () => {
    setDragX(0)
    setIsDragging(false)
    startX.current = null
    startY.current = null
    axisLocked.current = null
  }

  const pending = !!task.pending
  const inert = pending || done
  const isErrand = task.taskType === 'Errand'
  const tagColor = isErrand ? 'bg-tangerine' : 'bg-accent'
  const tagLabel = isErrand ? 'Errand' : 'Task'

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (inert) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    startX.current = e.clientX
    startY.current = e.clientY
    axisLocked.current = null
    didSwipe.current = false
    setIsDragging(true)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current === null || startY.current === null) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    if (axisLocked.current === null) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return
      axisLocked.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (axisLocked.current === 'x') {
        rowRef.current?.setPointerCapture?.(e.pointerId)
      }
    }
    if (axisLocked.current !== 'x') return
    const clamped = Math.max(-MAX_SWIPE, Math.min(20, dx))
    setDragX(clamped)
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (axisLocked.current === 'x') {
      didSwipe.current = true
      if (dragX <= -SWIPE_THRESHOLD) {
        onToggleToday(task.uuid, task.isScheduledToday)
      }
      rowRef.current?.releasePointerCapture?.(e.pointerId)
    }
    reset()
  }

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (axisLocked.current === 'x') {
      didSwipe.current = true
      rowRef.current?.releasePointerCapture?.(e.pointerId)
    }
    reset()
  }

  const handleRowClick = () => {
    if (inert) return
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }
    onEnterFocus(task.uuid)
  }

  const showSwipeReveal = dragX < 0

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[22px] border-[3px] border-ink bg-card shadow-[4px_4px_0_0_#2A1B3D]',
        pending && 'opacity-60',
      )}
      style={
        isNew
          ? { animation: 'annadoIn .5s cubic-bezier(.22,1,.36,1) both' }
          : undefined
      }
    >
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex w-[120px] items-center justify-end pr-5 transition-opacity',
          task.isScheduledToday
            ? 'bg-track-pink text-ink'
            : 'bg-tangerine text-white',
          showSwipeReveal ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden
      >
        <div className="flex items-center gap-1.5 text-[13px] font-extrabold">
          {task.isScheduledToday ? (
            <>
              <CalendarOff className="h-4 w-4" />
              Clear
            </>
          ) : (
            <>
              <Sun className="h-4 w-4" />
              Today
            </>
          )}
        </div>
      </div>

      <div
        ref={rowRef}
        className="relative flex select-none items-center gap-[14px] bg-card px-4 py-[14px]"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 220ms ease',
          touchAction: 'pan-y',
          ...(isNew ? { animation: 'annadoFlash 1.2s ease .15s both' } : null),
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <CheckCircle
          done={done}
          disabled={pending}
          onToggle={() => onToggle(task, done)}
        />
        <button
          type="button"
          className="flex min-w-0 flex-1 flex-col items-start text-left"
          onClick={handleRowClick}
        >
          <span
            className={cn(
              'text-[17px] font-extrabold leading-[1.25]',
              done ? 'text-disabled line-through' : 'text-ink',
            )}
          >
            {renderTitle(task.displayText)}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2 py-[2px] text-[11px] font-extrabold uppercase tracking-[0.08em] text-white',
                tagColor,
              )}
            >
              {tagLabel}
            </span>
            {pending && (
              <span className="text-[12px] font-extrabold text-disabled">
                queued
              </span>
            )}
            {!pending && task.status === 'Doing' && !done && (
              <span className="text-[12px] font-extrabold text-doing">
                doing
              </span>
            )}
            <span
              className={cn(
                'text-[12px] font-extrabold',
                whenLabel === 'overdue' && !done
                  ? 'text-overdue'
                  : 'text-disabled',
              )}
            >
              {whenLabel}
            </span>
          </span>
        </button>
        <span
          className={cn(
            'h-4 w-4 shrink-0 border-2 border-ink',
            isErrand
              ? 'rotate-45 rounded-[4px] bg-tangerine'
              : 'rounded-full bg-accent',
            done && 'opacity-25',
          )}
          aria-hidden
        />
      </div>
    </div>
  )
}
