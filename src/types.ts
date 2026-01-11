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
}

export type TaskStatus = 'Todo' | 'Done' | 'Doing'

export type Priority = 'Urgent' | 'High' | 'Medium' | 'Low' | 'None'

export interface TagExtension {
  name: TaskType
}

export type TaskType = 'task' | 'errand'

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
}
