import { Moon, RefreshCw, Server, Sun, Terminal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { getBackend, setBackend } from '../backend'
import { useMarkDone, useToggleScheduleToday } from '../hooks/use-tasks'
import { isToday } from '../lib/date'
import { cn } from '../lib/utils'
import type { BottomTab, Task, TaskListProps, TaskType } from '../types'
import { AddTaskModal } from './add-task-modal'
import { BottomTabBar } from './bottom-tab-bar'
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
  if (overdue.length) out.push({ label: 'Overdue', tasks: overdue })
  if (today.length) out.push({ label: 'Today', tasks: today })
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
  const [modalOpen, setModalOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark'
    } catch {
      return false
    }
  })
  const [backend, setBackendState] = useState(getBackend)
  const addTaskInputRef = useRef<HTMLInputElement>(null)

  const markDone = useMarkDone()
  const toggleToday = useToggleScheduleToday()

  const openAddModal = () => {
    flushSync(() => setModalOpen(true))
    addTaskInputRef.current?.focus()
  }

  const handleToggleBackend = () => {
    const next = backend === 'cli' ? 'http' : 'cli'
    setBackend(next)
    setBackendState(next)
    window.location.reload()
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('add')) {
      setModalOpen(true)
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
      // Flat list — already filtered to today/overdue
      return [{ label: '', tasks: filtered }]
    }
    return groupTasks(filtered)
  }, [filtered, activeTab])

  const defaultModalType: TaskType = activeTab === 'errands' ? 'Errand' : 'task'

  const headerLabel =
    activeTab === 'today'
      ? 'Today'
      : activeTab === 'tasks'
        ? 'Tasks'
        : 'Errands'

  const todayCount = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.isScheduledToday ||
          (t.scheduledDate && t.scheduledDate.getTime() < Date.now()),
      ).length,
    [tasks],
  )

  const handleComplete = (uuid: string) => {
    markDone.mutate(uuid)
  }

  const handleToggleToday = (uuid: string, clear: boolean) => {
    toggleToday.mutate({ uuid, clear })
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <div className="px-5 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-baseline gap-2">
            <h1 className="text-[28px] font-bold tracking-tight text-foreground">
              {headerLabel}
            </h1>
            {activeTab === 'today' && todayCount > 0 && (
              <span className="text-[15px] font-medium text-muted-foreground">
                {todayCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground active:bg-secondary"
              onClick={onRefetch}
              disabled={isLoading}
              aria-label="Refresh"
            >
              <RefreshCw
                className={cn('h-[18px] w-[18px]', isLoading && 'animate-spin')}
              />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground active:bg-secondary"
              onClick={handleToggleBackend}
              title={`Backend: ${backend === 'cli' ? 'CLI (sidecar)' : 'HTTP API'} — click to switch`}
              aria-label="Toggle backend"
            >
              {backend === 'cli' ? (
                <Terminal className="h-[18px] w-[18px]" />
              ) : (
                <Server className="h-[18px] w-[18px]" />
              )}
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground active:bg-secondary"
              onClick={() => setIsDark((d) => !d)}
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {error && (
          <p className="px-5 py-3 text-[13px] text-destructive">{error}</p>
        )}
        {!isLoading && filtered.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
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
              <div className="px-5 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </div>
            )}
            <div className="divide-y divide-border/60">
              {section.tasks.map((task) => (
                <TaskItem
                  key={task.uuid}
                  task={task}
                  onComplete={handleComplete}
                  onToggleToday={handleToggleToday}
                  onEnterFocus={onEnterFocus}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <BottomTabBar
        active={activeTab}
        onChange={handleTabChange}
        onAdd={openAddModal}
      />

      <AddTaskModal
        open={modalOpen}
        defaultType={defaultModalType}
        onClose={() => setModalOpen(false)}
        inputRef={addTaskInputRef}
      />
    </div>
  )
}
