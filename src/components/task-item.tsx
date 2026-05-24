import { Calendar, Circle } from 'lucide-react'

import type { TaskItemProps } from '../types'
import { Checkbox } from './ui/checkbox'

export function TaskItem({
  task,
  isSelected,
  showCheckbox,
  onToggleSelect,
  onEnterFocus,
}: TaskItemProps) {
  return (
    <div className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-secondary/50">
      {showCheckbox ? (
        <div className="pt-0.5">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(task.uuid)}
          />
        </div>
      ) : (
        <div className="pt-1">
          <Circle className="h-[18px] w-[18px] text-border" strokeWidth={2} />
        </div>
      )}
      <button
        type="button"
        className="flex min-w-0 flex-1 flex-col gap-0.5 text-left hover:opacity-100"
        onClick={() => onEnterFocus(task.uuid)}
      >
        <span className="text-[15px] leading-snug text-foreground">
          {task.displayText}
        </span>
        <div className="flex items-center gap-2">
          {task.status === 'Doing' && (
            <span className="text-[12px] font-medium text-doing">
              In Progress
            </span>
          )}
          {task.isScheduledToday && (
            <span className="flex items-center gap-1 text-[12px] font-medium text-today">
              <Calendar className="h-3 w-3" />
              Today
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
  )
}
