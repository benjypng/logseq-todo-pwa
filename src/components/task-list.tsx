import { Moon, Plus, RefreshCw, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

import { moveTaskToDate } from '../api'
import { cn } from '../lib/utils'
import type { Task, TaskType } from '../types'
import { AddTaskModal } from './add-task-modal'
import { ScheduleBar } from './schedule-bar'
import { TaskItem } from './task-item'

const TAB_STORAGE_KEY = 'logseq-pwa-active-tab'

function readStoredTab(): 'all' | 'today' {
  try {
    const v = localStorage.getItem(TAB_STORAGE_KEY)
    return v === 'today' ? 'today' : 'all'
  } catch {
    return 'all'
  }
}

interface TaskListProps {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  onEnterFocus: (uuid: string) => void
  onRefetch: () => void
}

type Section = 'tasks' | 'errands'

export function TaskList({
  tasks,
  isLoading,
  error,
  onEnterFocus,
  onRefetch,
}: TaskListProps) {
  const [activeSection, setActiveSection] = useState<Section>('tasks')
  const [activeTab, setActiveTab] = useState<'all' | 'today'>(readStoredTab)
  const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set())
  const [isScheduling, setIsScheduling] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark'
    } catch {
      return false
    }
  })

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

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const sectionTasks = tasks.filter((t) => {
    if (t.scheduledDate && t.scheduledDate > today) return false
    return activeSection === 'tasks'
      ? t.taskType === 'task'
      : t.taskType === 'Errand'
  })
  const todayTasks = sectionTasks.filter((t) => t.isScheduledToday)
  const sortedSectionTasks = [
    ...sectionTasks.filter((t) => t.isScheduledToday),
    ...sectionTasks.filter((t) => !t.isScheduledToday),
  ]
  const displayedTasks = activeTab === 'today' ? todayTasks : sortedSectionTasks

  const defaultModalType: TaskType =
    activeSection === 'tasks' ? 'task' : 'Errand'

  const handleSectionChange = (section: Section) => {
    setActiveSection(section)
    setActiveTab('all')
    localStorage.setItem(TAB_STORAGE_KEY, 'all')
    setSelectedUuids(new Set())
  }

  const handleTabChange = (tab: 'all' | 'today') => {
    setActiveTab(tab)
    try {
      localStorage.setItem(TAB_STORAGE_KEY, tab)
    } catch {
      // ignore
    }
    setSelectedUuids(new Set())
  }

  const handleToggleSelect = (uuid: string) => {
    setSelectedUuids((prev) => {
      const next = new Set(prev)
      if (next.has(uuid)) {
        next.delete(uuid)
      } else {
        next.add(uuid)
      }
      return next
    })
  }

  const handleScheduleForToday = async () => {
    setIsScheduling(true)
    try {
      const today = new Date()
      const updates = sectionTasks
        .filter((t) => selectedUuids.has(t.uuid))
        .map((task) => moveTaskToDate({ uuid: task.uuid, date: today }))
      await Promise.all(updates)
      setSelectedUuids(new Set())
      onRefetch()
    } catch (err) {
      console.error('Failed to schedule tasks:', err)
    } finally {
      setIsScheduling(false)
    }
  }

  const sectionLabel = activeSection === 'tasks' ? 'Tasks' : 'Errands'

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <div className="px-5 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between pb-1">
          <h1 className="text-[28px] font-bold tracking-tight text-foreground">
            {sectionLabel}
          </h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground active:bg-secondary"
              onClick={onRefetch}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn('h-[18px] w-[18px]', isLoading && 'animate-spin')}
              />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground active:bg-secondary"
              onClick={() => setIsDark((d) => !d)}
            >
              {isDark ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>

        {/* Section & Filter pills */}
        <div className="flex items-center gap-4 pb-2 pt-1">
          <div className="flex gap-1.5">
            <button
              type="button"
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                activeSection === 'tasks'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground active:bg-secondary',
              )}
              onClick={() => handleSectionChange('tasks')}
            >
              Tasks
            </button>
            <button
              type="button"
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                activeSection === 'errands'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground active:bg-secondary',
              )}
              onClick={() => handleSectionChange('errands')}
            >
              Errands
            </button>
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex gap-1.5">
            <button
              type="button"
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                activeTab === 'all'
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground active:bg-secondary',
              )}
              onClick={() => handleTabChange('all')}
            >
              All
            </button>
            <button
              type="button"
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                activeTab === 'today'
                  ? 'bg-today/15 text-today'
                  : 'text-muted-foreground active:bg-secondary',
              )}
              onClick={() => handleTabChange('today')}
            >
              Today{todayTasks.length > 0 ? ` ${todayTasks.length}` : ''}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-5 border-b border-border" />

      {/* Task list */}
      <div className="flex-1 overflow-y-auto pb-24">
        {error && (
          <p className="px-5 py-3 text-[13px] text-destructive">{error}</p>
        )}
        {!isLoading && displayedTasks.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <p className="text-[15px] text-muted-foreground">
              {activeTab === 'today'
                ? `No ${activeSection} scheduled for today`
                : `No ${activeSection}`}
            </p>
          </div>
        )}
        {displayedTasks.map((task) => (
          <TaskItem
            key={task.uuid}
            task={task}
            isSelected={selectedUuids.has(task.uuid)}
            showCheckbox={activeTab === 'all'}
            onToggleSelect={handleToggleSelect}
            onEnterFocus={onEnterFocus}
          />
        ))}
      </div>

      {/* Schedule bar */}
      {selectedUuids.size > 0 && activeTab === 'all' && (
        <ScheduleBar
          selectedCount={selectedUuids.size}
          onSchedule={handleScheduleForToday}
          isLoading={isScheduling}
        />
      )}

      {/* Floating add button */}
      {selectedUuids.size === 0 && (
        <div className="fixed bottom-0 left-0 right-0 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3 px-5 bg-gradient-to-t from-background via-background to-transparent">
          <button
            type="button"
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/25 active:bg-primary/80 transition-colors"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
            New {activeSection === 'tasks' ? 'Task' : 'Errand'}
          </button>
        </div>
      )}

      <AddTaskModal
        open={modalOpen}
        defaultType={defaultModalType}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
