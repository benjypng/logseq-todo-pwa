interface MascotCardProps {
  done: number
  total: number
}

function Mascot({ allDone }: { allDone: boolean }) {
  return (
    <div
      className={`relative h-[62px] w-[62px] shrink-0 ${allDone ? 'candy-wobble-fast' : 'candy-wobble'}`}
      aria-hidden
    >
      <div className="absolute inset-0 rounded-[50%_50%_46%_46%] border-[3px] border-ink bg-[linear-gradient(165deg,#FFE45E,#FF9F1C)]" />
      <span className="candy-blink absolute left-[12px] top-[22px] h-[11px] w-[11px] rounded-full bg-ink" />
      <span className="candy-blink absolute right-[12px] top-[22px] h-[11px] w-[11px] rounded-full bg-ink" />
      <span className="absolute left-[4px] top-[32px] h-[6px] w-[10px] rounded-full bg-accent opacity-60" />
      <span className="absolute right-[4px] top-[32px] h-[6px] w-[10px] rounded-full bg-accent opacity-60" />
      {allDone ? (
        <span className="absolute left-[19px] top-[37px] h-4 w-6 rounded-[0_0_14px_14px] bg-ink" />
      ) : (
        <span className="absolute left-[22px] top-[41px] h-[5px] w-[18px] rounded-[4px] bg-ink" />
      )}
    </div>
  )
}

export function MascotCard({ done, total }: MascotCardProps) {
  const allDone = total > 0 && done === total
  const remaining = total - done

  const line =
    done === 0
      ? 'I am simply sitting here.'
      : allDone
        ? 'LOOK AT YOU GO.'
        : 'Ooh, momentum.'
  const sub =
    done === 0
      ? 'Tap one circle. Just one. For me.'
      : allDone
        ? 'Nothing left. Go eat something.'
        : `${remaining} to go and I do a little dance.`

  return (
    <div className="flex items-center gap-[14px] rounded-[26px] border-[3px] border-ink bg-card px-4 py-[14px] shadow-[5px_5px_0_0_#2A1B3D]">
      <Mascot allDone={allDone} />
      <div className="min-w-0">
        <p className="font-display text-[19px] font-semibold leading-[1.2] text-ink">
          {line}
        </p>
        <p className="mt-0.5 text-[13px] font-bold text-muted-foreground">
          {sub}
        </p>
      </div>
    </div>
  )
}
