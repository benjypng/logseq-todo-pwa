import { Briefcase, ListTodo, Sun } from 'lucide-react'

import { cn } from '../lib/utils'
import type { BottomTab, BottomTabBarProps } from '../types'

const TABS: {
  value: BottomTab
  label: string
  activeClass: string
  Icon: typeof Sun
}[] = [
  { value: 'today', label: 'Today', activeClass: 'bg-tangerine', Icon: Sun },
  { value: 'tasks', label: 'Tasks', activeClass: 'bg-accent', Icon: ListTodo },
  {
    value: 'errands',
    label: 'Errands',
    activeClass: 'bg-grape',
    Icon: Briefcase,
  },
]

export function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  return (
    <nav
      className="shrink-0 border-t-[3px] border-ink bg-navbar px-2 pt-[10px]"
      style={{ paddingBottom: 'max(22px, env(safe-area-inset-bottom))' }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-stretch gap-1">
        {TABS.map(({ value, label, activeClass, Icon }) => {
          const isActive = active === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-[5px] rounded-[18px] border-[3px] px-1 py-2 font-display text-[13px] font-semibold transition-all duration-[180ms]',
                isActive
                  ? `${activeClass} border-ink text-white`
                  : 'border-transparent text-disabled',
              )}
            >
              <Icon
                className={cn(
                  'h-[19px] w-[19px]',
                  isActive ? 'text-white' : 'text-dot-idle',
                )}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
