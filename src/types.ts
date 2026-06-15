export interface BaseLogseqBlock {
  fullTitle: string
  uuid: string
  createdAt: number
}

export interface LogseqTask {
  ['full-title']: string
  uuid: string
  ['created-at']: number
  ['updated-at']: number
  [':logseq.property/status']: number
  [':logseq.property/priority']: number
  status: TaskStatus
  priority: Priority
  taskType: TaskType
  journalDate: Date | null
  scheduledDate: Date | null
  deadline: Date | null
  effectiveDate: Date | null
}

export interface LogseqGraph {
  name: string
  path: string
  url: string
}

export type TaskStatus = 'Todo' | 'Done' | 'Doing' | 'Waiting'

export type Priority = 'Urgent' | 'High' | 'Medium' | 'Low' | 'None'

export type TaskType = 'task' | 'Errand'

export type AddType = 'task' | 'Errand' | 'Inbox'

// The UI-facing task model used throughout components
export interface Task {
  uuid: string
  displayText: string
  status: 'Todo' | 'Doing'
  scheduledDate: Date | null
  deadline: Date | null
  isScheduledToday: boolean
  pageName: string
  taskType: TaskType
}

export interface MoveTaskProps {
  uuid: string
  date: Date | null
}

export interface RawLogseqTask {
  ['full-title']: string
  uuid: string
  ['created-at']: number
  ['updated-at']: number
  [':logseq.property/status']: number
  [':logseq.property/priority']: number
  [':logseq.property/scheduled']?: number
  [':logseq.property/deadline']?: number
  page?: {
    name?: string
    ['journal-day']?: number
  }
}

export interface ScheduleTaskMutationProps {
  uuid: string
  date: Date
}

export interface SetDeadlineProps {
  uuid: string
  date: Date | null
}

export type BottomTab = 'today' | 'tasks' | 'errands'

export type Backend = 'cli' | 'http'

export type SyncState = 'synced' | 'pending' | 'error'

export interface SyncStatusDetail {
  ['ws-state']?: string
  ['last-error']?: unknown
  ['pending-local']?: number
  ['pending-server']?: number
  ['pending-asset']?: number
  ['local-tx']?: number
  ['remote-tx']?: number
}

export interface SyncStatus {
  state: SyncState
  detail: SyncStatusDetail | null
  error?: string
}

export type AppState = { mode: 'list' } | { mode: 'focus'; task: Task }

export interface TaskListProps {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  onEnterFocus: (uuid: string) => void
  onRefetch: () => void
}

export interface FocusModeProps {
  task: Task
  onExit: () => void
}

export interface TaskItemProps {
  task: Task
  onComplete: (uuid: string) => void
  onToggleToday: (uuid: string, clear: boolean) => void
  onEnterFocus: (uuid: string) => void
  isNew?: boolean
}

export interface BottomTabBarProps {
  active: BottomTab
  onChange: (tab: BottomTab) => void
  onAdd: () => void
}
