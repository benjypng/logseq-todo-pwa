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
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3">
      <button
        type="button"
        className="flex h-[50px] w-full items-center justify-center rounded-2xl bg-today text-[15px] font-semibold text-white shadow-lg shadow-today/25 transition-colors active:bg-today/80 disabled:opacity-40"
        onClick={onSchedule}
        disabled={isLoading}
      >
        {isLoading ? 'Scheduling...' : `Schedule for Today (${selectedCount})`}
      </button>
    </div>
  )
}
