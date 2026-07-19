import { Moon, Plus, RefreshCw, Sun } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useSetStatus, useToggleScheduleToday } from '../hooks/use-tasks'
import { isToday } from '../lib/date'
import { cn } from '../lib/utils'
import type { BottomTab, Task, TaskListProps } from '../types'
import { AddComposer } from './add-composer'
import { BottomTabBar } from './bottom-tab-bar'
import { SyncDot } from './sync-dot'
import { TaskItem } from './task-item'

const TAB_STORAGE_KEY = 'logseq-pwa-bottom-tab'

function readStoredTab(): BottomTab {
  try {
    const v = localStorage.getItem(TAB_STORAGE_KEY)
    if (v === 'today' || v === 'tasks' || v === 'errands') return v
  } catch {
    // ignore
  }
  return 'today'
}

interface Section {
  label: string
  tasks: Task[]
}

function groupTasks(tasks: Task[]): Section[] {
  const now = Date.now()
  const overdue: Task[] = []
  const today: Task[] = []
  const upcoming: Task[] = []
  const unscheduled: Task[] = []

  for (const t of tasks) {
    if (t.isScheduledToday) {
      today.push(t)
    } else if (t.scheduledDate && t.scheduledDate.getTime() < now) {
      overdue.push(t)
    } else if (t.scheduledDate) {
      upcoming.push(t)
    } else {
      unscheduled.push(t)
    }
  }

  upcoming.sort(
    (a, b) =>
      (a.scheduledDate?.getTime() ?? 0) - (b.scheduledDate?.getTime() ?? 0),
  )

  const out: Section[] = []
  if (today.length) out.push({ label: 'Today', tasks: today })
  if (overdue.length) out.push({ label: 'Overdue', tasks: overdue })
  if (upcoming.length) out.push({ label: 'Upcoming', tasks: upcoming })
  if (unscheduled.length) out.push({ label: 'No date', tasks: unscheduled })
  return out
}

export function TaskList({
  tasks,
  isLoading,
  error,
  onEnterFocus,
  onRefetch,
}: TaskListProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>(readStoredTab)
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark'
    } catch {
      return false
    }
  })
  const [composerOpen, setComposerOpen] = useState(false)

  const [newUuids, setNewUuids] = useState<Set<string>>(() => new Set())
  const prevUuids = useRef<Set<string> | null>(null)
  const expectNewUntil = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const setStatus = useSetStatus()
  const toggleToday = useToggleScheduleToday()

  const openComposer = () => setComposerOpen(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('add')) {
      setComposerOpen(true)
      params.delete('add')
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params}`
        : window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
    } catch {
      // ignore
    }
  }, [isDark])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    const current = new Set(tasks.map((t) => t.uuid))
    if (prevUuids.current === null) {
      prevUuids.current = current
      return
    }
    const added = [...current].filter((id) => !prevUuids.current?.has(id))
    prevUuids.current = current
    if (added.length && Date.now() < expectNewUntil.current) {
      setNewUuids((prev) => new Set([...prev, ...added]))
      for (const id of added) {
        timers.current.push(
          setTimeout(() => {
            setNewUuids((prev) => {
              if (!prev.has(id)) return prev
              const next = new Set(prev)
              next.delete(id)
              return next
            })
          }, 900),
        )
      }
    }
  }, [tasks])

  const handleTabChange = (tab: BottomTab) => {
    setActiveTab(tab)
    try {
      localStorage.setItem(TAB_STORAGE_KEY, tab)
    } catch {
      // ignore
    }
  }

  const filtered = useMemo(() => {
    if (activeTab === 'today') {
      return tasks.filter(
        (t) =>
          t.isScheduledToday ||
          (t.scheduledDate && t.scheduledDate.getTime() < Date.now()) ||
          (t.deadline && isToday(t.deadline)),
      )
    }
    return tasks.filter((t) =>
      activeTab === 'tasks' ? t.taskType === 'task' : t.taskType === 'Errand',
    )
  }, [tasks, activeTab])

  const sections = useMemo(() => {
    if (activeTab === 'today') {
      return [{ label: '', tasks: filtered }]
    }
    return groupTasks(filtered)
  }, [filtered, activeTab])

  const headerLabel =
    activeTab === 'today'
      ? 'Today'
      : activeTab === 'tasks'
        ? 'Tasks'
        : 'Errands'

  const handleComplete = (uuid: string) => {
    setStatus(uuid, 'Done')
  }

  const handleToggleToday = (uuid: string, clear: boolean) => {
    toggleToday(uuid, clear)
  }

  const iconBtn =
    'flex items-center text-icon transition-colors hover:text-accent active:text-accent'

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background">
      <div className="flex items-center gap-[14px] px-[30px] pt-[calc(20px+env(safe-area-inset-top))] pb-[6px]">
        <h1 className="font-serif text-[50px] font-normal leading-[0.9] tracking-[0.01em] text-foreground">
          {headerLabel}
        </h1>
        <div className="ml-auto flex items-center gap-5">
          <SyncDot enabled />
          <button
            type="button"
            className={cn(iconBtn, isLoading && 'animate-spin')}
            onClick={onRefetch}
            disabled={isLoading}
            aria-label="Refresh"
          >
            <RefreshCw className="h-[21px] w-[21px]" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className={iconBtn}
            onClick={() => setIsDark((d) => !d)}
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="h-[21px] w-[21px]" strokeWidth={1.8} />
            ) : (
              <Moon className="h-[21px] w-[21px]" strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[30px] pt-[2px] pb-[22px]">
        {error && <p className="py-3 text-[13px] text-destructive">{error}</p>}
        {!isLoading && filtered.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[15px] text-muted-foreground">
              {activeTab === 'today'
                ? 'Nothing scheduled for today'
                : activeTab === 'tasks'
                  ? 'No tasks'
                  : 'No errands'}
            </p>
          </div>
        )}
        {sections.map((section, i) => (
          <div key={section.label || `s-${i}`}>
            {section.label && (
              <div
                className={cn(
                  'text-[13px] font-bold uppercase tracking-[0.1em] text-muted-foreground',
                  i === 0 ? 'pt-[6px] pb-2' : 'pt-[26px] pb-2',
                )}
              >
                {section.label}
              </div>
            )}
            {section.tasks.map((task) => (
              <TaskItem
                key={task.uuid}
                task={task}
                onComplete={handleComplete}
                onToggleToday={handleToggleToday}
                onEnterFocus={onEnterFocus}
                isNew={newUuids.has(task.uuid)}
              />
            ))}
          </div>
        ))}
      </div>

      {!composerOpen && (
        <button
          type="button"
          onClick={openComposer}
          aria-label="Add item"
          className="absolute right-6 bottom-[calc(110px+env(safe-area-inset-bottom))] flex h-[62px] w-[62px] items-center justify-center rounded-full bg-accent text-white transition-[filter] hover:brightness-[1.06]"
          style={{
            boxShadow:
              '0 12px 28px rgba(191,125,42,.42), 0 2px 6px rgba(0,0,0,.12)',
          }}
        >
          <Plus className="h-[30px] w-[30px]" strokeWidth={2.3} />
        </button>
      )}

      <AddComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSubmitted={() => {
          expectNewUntil.current = Date.now() + 6000
        }}
      />

      <BottomTabBar
        active={activeTab}
        onChange={handleTabChange}
        onAdd={openComposer}
      />
    </div>
  )
}
