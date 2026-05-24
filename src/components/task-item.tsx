import { Calendar, CalendarOff, Flag, Sun } from 'lucide-react'
import { useRef, useState } from 'react'

import { formatScheduledDate, isToday } from '../lib/date'
import { cn } from '../lib/utils'
import type { TaskItemProps } from '../types'
import { Checkbox } from './ui/checkbox'

const SWIPE_THRESHOLD = 80
const MAX_SWIPE = 120
const AXIS_LOCK_PX = 6

export function TaskItem({
  task,
  onComplete,
  onToggleToday,
  onEnterFocus,
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

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
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
  const showDeadlineToday = task.deadline && isToday(task.deadline)

  return (
    <div className="relative overflow-hidden">
      {/* Swipe-left reveal: Today action (toggle) */}
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex w-[120px] items-center justify-end pr-5',
          task.isScheduledToday
            ? 'bg-muted text-foreground'
            : 'bg-accent text-accent-foreground',
          dragX <= -SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-80',
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
        className="relative flex select-none items-start gap-3 bg-background px-5 py-3"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 220ms ease',
          touchAction: 'pan-y',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div className="pt-0.5" onPointerDown={(e) => e.stopPropagation()}>
          <Checkbox
            checked={false}
            onCheckedChange={() => onComplete(task.uuid)}
            aria-label="Mark task done"
          />
        </div>
        <button
          type="button"
          className="flex min-w-0 flex-1 flex-col gap-0.5 text-left hover:opacity-100"
          onClick={handleRowClick}
        >
          <span className="text-[15px] leading-snug text-foreground">
            {task.displayText}
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {task.status === 'Doing' && (
              <span className="text-[12px] font-medium text-doing">
                In Progress
              </span>
            )}
            {task.isScheduledToday && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-1.5 py-0.5 text-[11px] font-semibold text-accent">
                <Calendar className="h-3 w-3" />
                Today
              </span>
            )}
            {task.deadline && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-[12px] font-medium',
                  deadlineOverdue
                    ? 'text-overdue'
                    : showDeadlineToday
                      ? 'text-accent'
                      : 'text-muted-foreground',
                )}
              >
                <Flag className="h-3 w-3" />
                {formatScheduledDate(task.deadline)}
              </span>
            )}
            {task.pageName && task.pageName !== 'Unknown' && (
              <span className="truncate text-[12px] text-muted-foreground">
                {task.pageName}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}
