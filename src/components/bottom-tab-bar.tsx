import { Briefcase, ListTodo, Plus, Sun } from 'lucide-react'

import { cn } from '../lib/utils'
import type { BottomTab, BottomTabBarProps } from '../types'

const TABS: { value: BottomTab; label: string; Icon: typeof Sun }[] = [
  { value: 'today', label: 'Today', Icon: Sun },
  { value: 'tasks', label: 'Tasks', Icon: ListTodo },
  { value: 'errands', label: 'Errands', Icon: Briefcase },
]

export function BottomTabBar({ active, onChange, onAdd }: BottomTabBarProps) {
  return (
    <nav
      className="shrink-0 border-t border-divider bg-navbar px-4 pt-4 pb-[26px]"
      style={{ paddingBottom: 'calc(26px + env(safe-area-inset-bottom))' }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        {TABS.map((tab) => {
          const isActive = active === tab.value
          const { Icon, label } = tab
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-[7px] text-[12.5px]',
                isActive
                  ? 'font-[650] text-accent'
                  : 'font-medium text-muted-foreground',
              )}
            >
              <Icon
                className="h-[23px] w-[23px]"
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span>{label}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add item"
          className="flex flex-1 flex-col items-center gap-[7px] text-[12.5px] font-[650] text-accent"
        >
          <Plus className="h-[23px] w-[23px]" strokeWidth={2.1} />
          <span>Add</span>
        </button>
      </div>
    </nav>
  )
}
