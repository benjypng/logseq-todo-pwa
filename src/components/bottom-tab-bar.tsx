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
      className="shrink-0 border-t border-border bg-card/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 py-1">
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
                'flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-accent' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.8} />
              <span>{label}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add task"
          className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium text-primary"
        >
          <Plus className="h-5 w-5" strokeWidth={2.4} />
          <span>Add</span>
        </button>
      </div>
    </nav>
  )
}
