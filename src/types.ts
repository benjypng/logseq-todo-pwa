import type { Dispatch, SetStateAction } from 'react'

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
  effectiveDate: Date | null
}

export interface DayColumn {
  date: Date
  dateKey: string
  dayName: string
  dayNumber: number
  isToday: boolean
  isPast: boolean
}

export interface TasksByDate {
  [dateKey: string]: LogseqTask[]
}

export interface LogseqGraph {
  name: string
  path: string
  url: string
}

export interface Expense {
  label: string
  value: number
  createdAt: number
}

export type TaskStatus = 'Todo' | 'Done' | 'Doing' | 'Waiting'

export type Priority = 'Urgent' | 'High' | 'Medium' | 'Low' | 'None'

export interface TagExtension {
  name: TaskType
}

export type TaskType = 'task' | 'Errand'

export interface FormValues {
  task: string
}

export interface SelectedTaskProps {
  selectedTask: LogseqTask
  setSelectedTask: Dispatch<SetStateAction<LogseqTask | null>>
}

export interface AddTaskModalProps {
  opened: boolean
  setOpened: Dispatch<SetStateAction<boolean>>
}

export interface AddTaskMutationProps {
  task: string
  priority: Priority
  type: 'task' | 'errand'
  date?: Date | null
}

export interface AddExpenseMutationProps {
  label: string
  value: number
}

export interface TaskListProps {
  tasks: LogseqTask[] | undefined
  type: 'task' | 'Errand'
  onSelect: (task: LogseqTask) => void
}

export interface RawLogseqTask {
  ['full-title']: string
  uuid: string
  ['created-at']: number
  ['updated-at']: number
  [':logseq.property/status']: number
  [':logseq.property/priority']: number
  [':logseq.property/scheduled']?: number
  page?: {
    name?: string
    ['journal-day']?: number
  }
}

export interface ScheduleTaskMutationProps {
  uuid: string
  date: Date
}

export interface WeekViewProps {
  onSelectTask: (task: LogseqTask) => void
  daysToShow?: number
}
