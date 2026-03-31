import { Moon, Plus, RefreshCw, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

import { moveTaskToDate } from '../api'
import { cn } from '../lib/utils'
import type { Task, TaskType } from '../types'
import { AddTaskModal } from './add-task-modal'
import { ScheduleBar } from './schedule-bar'
import { TaskItem } from './task-item'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

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

  // Open modal on launch if ?add query param is present
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

  const handleTabChange = (value: string) => {
    const tab = value as 'all' | 'today'
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

  const navItemClass = (section: Section) =>
    cn(
      'py-3.5 text-base font-medium border-b-2 -mb-px transition-colors',
      activeSection === section
        ? 'border-foreground text-foreground'
        : 'border-transparent text-muted-foreground',
    )

  return (
    <div className="flex h-dvh flex-col">
      <div className="flex items-center justify-between border-b border-border px-4">
        <div className="flex gap-5">
          <button
            type="button"
            className={navItemClass('tasks')}
            onClick={() => handleSectionChange('tasks')}
          >
            Tasks
          </button>
          <button
            type="button"
            className={navItemClass('errands')}
            onClick={() => handleSectionChange('errands')}
          >
            Errands
          </button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDark((d) => !d)}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="px-4 py-3">
          <TabsList>
            <TabsTrigger value="all" className="text-base py-2">
              All
            </TabsTrigger>
            <TabsTrigger value="today" className="text-base py-2">
              Today {todayTasks.length > 0 && `(${todayTasks.length})`}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="flex-1 overflow-y-auto pb-24">
          {error && (
            <p className="px-4 py-3 text-sm text-destructive">{error}</p>
          )}
          {!isLoading && displayedTasks.length === 0 && !error && (
            <p className="px-4 py-8 text-center text-base text-muted-foreground">
              No {activeSection}
            </p>
          )}
          {displayedTasks.map((task) => (
            <TaskItem
              key={task.uuid}
              task={task}
              isSelected={selectedUuids.has(task.uuid)}
              showCheckbox={true}
              onToggleSelect={handleToggleSelect}
              onEnterFocus={onEnterFocus}
            />
          ))}
        </TabsContent>

        <TabsContent value="today" className="flex-1 overflow-y-auto pb-24">
          {!isLoading && todayTasks.length === 0 && (
            <p className="px-4 py-8 text-center text-base text-muted-foreground">
              No {activeSection} scheduled for today
            </p>
          )}
          {todayTasks.map((task) => (
            <TaskItem
              key={task.uuid}
              task={task}
              isSelected={false}
              showCheckbox={false}
              onToggleSelect={handleToggleSelect}
              onEnterFocus={onEnterFocus}
            />
          ))}
        </TabsContent>
      </Tabs>

      {selectedUuids.size > 0 && activeTab === 'all' && (
        <ScheduleBar
          selectedCount={selectedUuids.size}
          onSchedule={handleScheduleForToday}
          isLoading={isScheduling}
        />
      )}

      {selectedUuids.size === 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefetch}
              disabled={isLoading}
              className="shrink-0"
            >
              <RefreshCw
                className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              className="flex-1 py-3 text-base"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="mr-2 h-5 w-5" /> Add Task
            </Button>
          </div>
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
