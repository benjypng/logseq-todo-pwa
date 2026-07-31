import { Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useCompletions } from '../hooks/use-completions'
import { useSetStatus, useToggleScheduleToday } from '../hooks/use-tasks'
import {
  type CompletionRecord,
  completionsOnDay,
  streakDays,
  weekDots,
} from '../lib/completions'
import { dueLabel, isToday } from '../lib/date'
import type { AddType, BottomTab, Task, TaskListProps } from '../types'
import { AddComposer } from './add-composer'
import { BottomTabBar } from './bottom-tab-bar'
import { CandyHeader } from './candy-header'
import { MascotCard } from './mascot-card'
import { SugarBar } from './sugar-bar'
import { TaskItem } from './task-item'

const TAB_STORAGE_KEY = 'logseq-pwa-bottom-tab'

function readStoredTab(): BottomTab {
  try {
    const v = localStorage.getItem(TAB_STORAGE_KEY)
    if (v === 'today' || v === 'tasks' || v === 'errands') return v
  } catch {
    return 'today'
  }
  return 'today'
}

function matchesToday(task: Task): boolean {
  return (
    task.isScheduledToday ||
    (task.scheduledDate !== null &&
      task.scheduledDate.getTime() < Date.now()) ||
    (task.deadline !== null && isToday(task.deadline))
  )
}

function matchesTab(tab: BottomTab, taskType: Task['taskType']): boolean {
  return tab === 'errands' ? taskType === 'Errand' : taskType === 'task'
}

function toDoneTask(record: CompletionRecord): Task {
  return {
    uuid: record.uuid,
    displayText: record.text,
    status: 'Todo',
    scheduledDate: null,
    deadline: null,
    isScheduledToday: record.wasToday,
    pageName: '',
    taskType: record.taskType,
  }
}

export function TaskList({
  tasks,
  isLoading,
  error,
  onEnterFocus,
  onRefetch,
}: TaskListProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>(readStoredTab)
  const [composerOpen, setComposerOpen] = useState(false)

  const [newUuids, setNewUuids] = useState<Set<string>>(() => new Set())
  const prevUuids = useRef<Set<string> | null>(null)
  const expectNewUntil = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const setStatus = useSetStatus()
  const toggleToday = useToggleScheduleToday()
  const { records, complete, uncomplete } = useCompletions()

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
      return
    }
  }

  const filtered = useMemo(() => {
    const visible =
      activeTab === 'today'
        ? tasks.filter(matchesToday)
        : tasks.filter((t) => matchesTab(activeTab, t.taskType))
    return [...visible].sort(
      (a, b) =>
        (a.scheduledDate?.getTime() ??
          a.deadline?.getTime() ??
          Number.POSITIVE_INFINITY) -
        (b.scheduledDate?.getTime() ??
          b.deadline?.getTime() ??
          Number.POSITIVE_INFINITY),
    )
  }, [tasks, activeTab])

  const doneRecords = useMemo(() => {
    const liveUuids = new Set(tasks.map((t) => t.uuid))
    return completionsOnDay(records, new Date())
      .filter((r) => !liveUuids.has(r.uuid))
      .filter((r) =>
        activeTab === 'today' ? r.wasToday : matchesTab(activeTab, r.taskType),
      )
      .sort((a, b) => a.completedAt - b.completedAt)
  }, [records, tasks, activeTab])

  const doneCount = doneRecords.length
  const total = filtered.length + doneCount
  const streak = streakDays(records, new Date())
  const dots = weekDots(records, new Date())

  const handleToggle = (task: Task, done: boolean) => {
    if (done) {
      uncomplete(task.uuid)
      setStatus(task.uuid, 'Todo')
    } else {
      complete({
        uuid: task.uuid,
        text: task.displayText,
        taskType: task.taskType,
        whenLabel: dueLabel(task.scheduledDate, task.deadline),
        wasToday: matchesToday(task),
        completedAt: Date.now(),
      })
      setStatus(task.uuid, 'Done')
    }
  }

  const handleToggleToday = (uuid: string, clear: boolean) => {
    toggleToday(uuid, clear)
  }

  const handleSubmitted = (type: AddType) => {
    expectNewUntil.current = Date.now() + 6000
    handleTabChange(type === 'Errand' ? 'errands' : 'tasks')
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background">
      <CandyHeader
        tab={activeTab}
        streak={streak}
        weekDots={dots}
        isLoading={isLoading}
        onRefetch={onRefetch}
      />

      <div className="flex-1 overflow-y-auto px-5 pb-[100px] pt-[18px]">
        {error && (
          <p className="pb-3 text-[13px] font-bold text-destructive">{error}</p>
        )}

        <MascotCard done={doneCount} total={total} />

        <div className="mt-[14px]">
          <SugarBar done={doneCount} total={total} />
        </div>

        {!isLoading && total === 0 && !error ? (
          <div className="mt-4 rounded-[26px] border-[3px] border-dashed border-dash-pink px-5 py-10 text-center">
            <p className="font-display text-[22px] font-semibold text-accent">
              Nothing here. Suspicious.
            </p>
            <p className="mt-1 text-[14px] font-bold text-muted-foreground">
              Hit the big pink button and give me something to chew on.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {filtered.map((task) => (
              <TaskItem
                key={task.uuid}
                task={task}
                done={false}
                whenLabel={dueLabel(task.scheduledDate, task.deadline)}
                onToggle={handleToggle}
                onToggleToday={handleToggleToday}
                onEnterFocus={onEnterFocus}
                isNew={newUuids.has(task.uuid)}
              />
            ))}
            {doneRecords.map((record) => (
              <TaskItem
                key={record.uuid}
                task={toDoneTask(record)}
                done
                whenLabel={record.whenLabel}
                onToggle={handleToggle}
                onToggleToday={handleToggleToday}
                onEnterFocus={onEnterFocus}
              />
            ))}
          </div>
        )}
      </div>

      {!composerOpen && (
        <button
          type="button"
          onClick={openComposer}
          aria-label="Add item"
          className="absolute right-5 flex h-[68px] w-[68px] items-center justify-center rounded-full border-4 border-ink bg-accent text-white shadow-[5px_5px_0_0_#2A1B3D] transition-[transform,box-shadow] duration-100 active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_0_#2A1B3D]"
          style={{ bottom: 'calc(112px + env(safe-area-inset-bottom))' }}
        >
          <Plus className="h-[26px] w-[26px]" strokeWidth={3} />
        </button>
      )}

      <AddComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSubmitted={handleSubmitted}
      />

      <BottomTabBar active={activeTab} onChange={handleTabChange} />
    </div>
  )
}
