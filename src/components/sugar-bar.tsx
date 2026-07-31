interface SugarBarProps {
  done: number
  total: number
}

export function SugarBar({ done, total }: SugarBarProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total

  return (
    <div>
      <div className="h-4 overflow-hidden rounded-full border-[3px] border-ink bg-track-pink">
        <div
          className="candy-shimmer h-full rounded-full bg-[linear-gradient(90deg,#FFE45E,#FF3D8B,#6A5CFF)] bg-[length:200%_100%] transition-[width] duration-[450ms] ease-[cubic-bezier(0.22,1.2,0.36,1)]"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[12px] font-extrabold uppercase tracking-[0.06em] text-muted-foreground">
        <span>{allDone ? 'Day cleared' : 'Sugar level'}</span>
        <span>
          {done} / {total}
        </span>
      </div>
    </div>
  )
}
