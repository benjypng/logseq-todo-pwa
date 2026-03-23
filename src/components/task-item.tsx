import type { Task } from '../types'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'

interface TaskItemProps {
  task: Task
  isSelected: boolean
  showCheckbox: boolean
  onToggleSelect: (uuid: string) => void
  onEnterFocus: (uuid: string) => void
}

export function TaskItem({
  task,
  isSelected,
  showCheckbox,
  onToggleSelect,
  onEnterFocus,
}: TaskItemProps) {
  return (
    <div
      className={`flex items-center gap-3 border-b border-border px-4 py-3${task.isScheduledToday ? ' bg-amber-50 dark:bg-amber-950/30' : ''}`}
    >
      {showCheckbox && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(task.uuid)}
        />
      )}
      <button
        type="button"
        className="flex-1 cursor-pointer text-left text-sm leading-snug"
        onClick={() => onEnterFocus(task.uuid)}
      >
        {task.displayText}
      </button>
      <div className="flex shrink-0 gap-1">
        {task.status === 'Doing' && (
          <Badge variant="default" className="text-xs">
            In Progress
          </Badge>
        )}
        {task.isScheduledToday && (
          <Badge className="bg-amber-500 text-xs text-white hover:bg-amber-500">
            Today
          </Badge>
        )}
      </div>
    </div>
  )
}
