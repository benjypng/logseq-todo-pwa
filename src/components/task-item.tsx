import { CalendarOff, Flag, Sun } from 'lucide-react'
import { Fragment, type ReactNode, useRef, useState } from 'react'

import { formatAnnadoDate, isToday } from '../lib/date'
import { cn } from '../lib/utils'
import type { TaskItemProps } from '../types'
import { Checkbox } from './ui/checkbox'

const SWIPE_THRESHOLD = 80
const MAX_SWIPE = 120
const AXIS_LOCK_PX = 6

const WIKI_LINK_RE = /(\[\[[^\]]+\]\])/g

function renderTitle(text: string): ReactNode {
  const parts = text.split(WIKI_LINK_RE).filter(Boolean)
  return parts.map((part, i) =>
    part.startsWith('[[') && part.endsWith(']]') ? (
      <span key={i} className="font-semibold text-ref">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}

export function TaskItem({
  task,
  onComplete,
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

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pending) return
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
    if (pending) return
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }
    onEnterFocus(task.uuid)
  }

  const deadlineOverdue =
    task.deadline &&
    task.deadline.getTime() < Date.now() &&
    !isToday(task.deadline)
  const dateToShow = task.scheduledDate ?? task.deadline
  const showSwipeReveal = dragX < 0

  return (
    <div
      className="relative overflow-hidden"
      style={
        isNew
          ? { animation: 'annadoIn .5s cubic-bezier(.22,1,.36,1) both' }
          : undefined
      }
    >
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex w-[120px] items-center justify-end pr-[30px] transition-opacity',
          task.isScheduledToday
            ? 'bg-muted text-foreground'
            : 'bg-accent text-accent-foreground',
          showSwipeReveal ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden
      >
        <div className="flex items-center gap-1.5 text-[13px] font-semibold">
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
        className={cn(
          'relative flex select-none items-start gap-[17px] border-b border-divider bg-background px-[30px] py-[21px]',
          pending && 'opacity-55',
        )}
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
        <div className="pt-[1px]" onPointerDown={(e) => e.stopPropagation()}>
          <Checkbox
            checked={false}
            disabled={pending}
            onCheckedChange={() => onComplete(task.uuid)}
            aria-label="Mark task done"
          />
        </div>
        <button
          type="button"
          className="flex min-w-0 flex-1 flex-col gap-2 pt-[2px] text-left"
          onClick={handleRowClick}
        >
          <span className="text-[18.5px] font-medium leading-[1.4] text-foreground">
            {renderTitle(task.displayText)}
          </span>
          {(dateToShow || task.status === 'Doing' || pending) && (
            <span className="flex flex-wrap items-center gap-x-2 text-[14.5px] font-[450]">
              {pending && <span className="text-faint">Queued</span>}
              {task.status === 'Doing' && (
                <span className="text-doing">In progress</span>
              )}
              {dateToShow && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1',
                    deadlineOverdue ? 'text-overdue' : 'text-faint',
                  )}
                >
                  {task.deadline && !task.scheduledDate && (
                    <Flag className="h-3.5 w-3.5" />
                  )}
                  {formatAnnadoDate(dateToShow)}
                </span>
              )}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
