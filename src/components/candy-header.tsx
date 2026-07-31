import { RefreshCw } from 'lucide-react'

import { cn } from '../lib/utils'
import type { BottomTab } from '../types'
import { SyncDot } from './sync-dot'

interface CandyHeaderProps {
  tab: BottomTab
  streak: number
  weekDots: boolean[]
  isLoading: boolean
  onRefetch: () => void
}

const COPY: Record<BottomTab, { title: string; subtitle: string }> = {
  today: { title: 'Today', subtitle: 'Small day. Big energy.' },
  tasks: { title: 'Tasks', subtitle: 'Sweet, sweet unfinished business.' },
  errands: { title: 'Errands', subtitle: 'Out-in-the-world stuff.' },
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function CandyHeader({
  tab,
  streak,
  weekDots,
  isLoading,
  onRefetch,
}: CandyHeaderProps) {
  const { title, subtitle } = COPY[tab]

  return (
    <header className="shrink-0 bg-[linear-gradient(160deg,#FF3D8B_0%,#6A5CFF_100%)] px-[22px] pb-[14px] pt-[calc(20px+env(safe-area-inset-top))] text-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[40px] font-semibold leading-none">
            {title}
          </h1>
          <p className="mt-1 text-[14px] font-bold opacity-90">{subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <span className="flex items-center gap-2 rounded-full border-2 border-white/50 bg-white/[0.22] px-3 py-1.5 font-display text-[15px] font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-mint" />
            {streak} day streak
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.22]">
            <SyncDot enabled />
          </span>
          <button
            type="button"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.22]',
              isLoading && 'animate-spin',
            )}
            onClick={onRefetch}
            disabled={isLoading}
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7">
        {DAY_LETTERS.map((letter, i) => (
          <div
            key={`${letter}-${i}`}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={cn(
                'h-[22px] w-[22px] rounded-full',
                weekDots[i]
                  ? 'border-2 border-white/90 bg-lemon shadow-[0_0_0_3px_rgba(255,255,255,0.18)]'
                  : 'border-2 border-dashed border-white/55 bg-white/[0.16]',
              )}
            />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] opacity-75">
              {letter}
            </span>
          </div>
        ))}
      </div>
    </header>
  )
}
