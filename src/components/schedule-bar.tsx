import { Button } from './ui/button'

interface ScheduleBarProps {
  selectedCount: number
  onSchedule: () => void
  isLoading: boolean
}

export function ScheduleBar({
  selectedCount,
  onSchedule,
  isLoading,
}: ScheduleBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4">
      <Button className="w-full" onClick={onSchedule} disabled={isLoading}>
        {isLoading ? 'Scheduling...' : `Schedule for Today (${selectedCount})`}
      </Button>
    </div>
  )
}
