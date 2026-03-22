import { Plus, RefreshCw } from 'lucide-react'
import { useState } from 'react'

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

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const sectionTasks = tasks.filter((t) => {
    if (t.scheduledDate && t.scheduledDate > today) return false
    return activeSection === 'tasks' ? t.taskType === 'task' : t.taskType === 'Errand'
  })
  const todayTasks = sectionTasks.filter((t) => t.isScheduledToday)
  const displayedTasks = activeTab === 'today' ? todayTasks : sectionTasks

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
      'py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
      activeSection === section
        ? 'border-foreground text-foreground'
        : 'border-transparent text-muted-foreground',
    )

  return (
    <div className="flex h-dvh flex-col">
      <div className="flex items-center border-b border-border px-4">
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
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefetch}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="px-4 py-2">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">
              Today {todayTasks.length > 0 && `(${todayTasks.length})`}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="flex-1 overflow-y-auto pb-20">
          {error && (
            <p className="px-4 py-3 text-sm text-destructive">{error}</p>
          )}
          {!isLoading && displayedTasks.length === 0 && !error && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
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

        <TabsContent value="today" className="flex-1 overflow-y-auto">
          {!isLoading && todayTasks.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
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

      {activeTab === 'all' && (
        <ScheduleBar
          selectedCount={selectedUuids.size}
          onSchedule={handleScheduleForToday}
          isLoading={isScheduling}
        />
      )}

      <AddTaskModal
        open={modalOpen}
        defaultType={defaultModalType}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
