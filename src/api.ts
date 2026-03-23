import { format } from 'date-fns'
import wretch from 'wretch'

import {
  BASE_URL,
  GET_ERRANDS_FROM_LOGSEQ,
  GET_TASKS_FROM_LOGSEQ,
  TASK_SCHEDULED_KEY,
  TASK_STATUS_KEY,
} from './constants'
import type {
  BaseLogseqBlock,
  LogseqGraph,
  LogseqTask,
  MoveTaskProps,
  Priority,
  TaskStatus,
} from './types'
import { computeEffectiveDate, parseJournalDay } from './utils/date-utils'

interface RawLogseqTask {
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

const api = wretch()
  .url(BASE_URL)
  .headers({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_LOGSEQ_TOKEN}`,
  })
  .catcherFallback((error: unknown) => {
    console.error('Global API Error:', error)
    throw error
  })

export const getCurrGraphName = async (): Promise<string> => {
  const currGraph = await api
    .post({ method: 'logseq.App.getCurrentGraph', args: [] })
    .json<LogseqGraph>()
  return currGraph.name.replace('logseq_db_', '')
}

export const getTasksFromLogseq = async (): Promise<LogseqTask[]> => {
  const allTasks = await api
    .post({
      method: 'logseq.DB.datascriptQuery',
      args: [GET_TASKS_FROM_LOGSEQ],
    })
    .json<[RawLogseqTask, TaskStatus, Priority, string][]>()

  const allErrands = await api
    .post({
      method: 'logseq.DB.datascriptQuery',
      args: [GET_ERRANDS_FROM_LOGSEQ],
    })
    .json<[RawLogseqTask, TaskStatus, Priority, string][]>()

  const mappedTasksAndErrands = allTasks
    .concat(allErrands)
    .map(([logseqTask, taskStatus, priority, tagName]) => {
      const task = logseqTask as Record<string, unknown>

      const page = task.page as { 'journal-day'?: number } | undefined
      const journalDay = page?.['journal-day'] ?? null
      const journalDate = parseJournalDay(journalDay)

      const scheduledRaw = task[':logseq.property/scheduled'] as
        | number
        | undefined
      const scheduledDate = scheduledRaw
        ? parseJournalDay(scheduledRaw)
        : null

      const effectiveDate = computeEffectiveDate(journalDate, scheduledDate)

      return {
        ...logseqTask,
        status: taskStatus,
        priority: priority,
        taskType: tagName as 'task' | 'Errand',
        journalDate,
        scheduledDate,
        effectiveDate,
      }
    })

  return mappedTasksAndErrands.flat()
}

export const markTaskAsDone = async (uuid: string) => {
  await api
    .post({
      method: 'logseq.Editor.upsertBlockProperty',
      args: [uuid, TASK_STATUS_KEY, 'Done'],
    })
    .json<BaseLogseqBlock>()
}

export const markTaskAsDoing = async (uuid: string) => {
  await api
    .post({
      method: 'logseq.Editor.upsertBlockProperty',
      args: [uuid, TASK_STATUS_KEY, 'Doing'],
    })
    .json<BaseLogseqBlock>()
}

export const markTaskAsTodo = async (uuid: string) => {
  await api
    .post({
      method: 'logseq.Editor.upsertBlockProperty',
      args: [uuid, TASK_STATUS_KEY, 'Todo'],
    })
    .json<BaseLogseqBlock>()
}

export const addTaskToLogseq = async ({
  title,
  type,
}: {
  title: string
  type: 'task' | 'Errand'
}) => {
  const todayDate = format(new Date(), 'MMM do, yyyy')
  const createdBlock = await api
    .post({
      method: 'logseq.Editor.appendBlockInPage',
      args: [todayDate, title],
    })
    .json<BaseLogseqBlock>()
  await api
    .post({
      method: 'logseq.Editor.addBlockTag',
      args: [createdBlock.uuid, type],
    })
    .json()
}

export const moveTaskToDate = async ({ uuid, date }: MoveTaskProps) => {
  if (date === null) {
    await api
      .post({
        method: 'logseq.Editor.removeBlockProperty',
        args: [uuid, TASK_SCHEDULED_KEY],
      })
      .json()
  } else {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const dateValue = `${yyyy}-${mm}-${dd}`
    await api
      .post({
        method: 'logseq.Editor.upsertBlockProperty',
        args: [uuid, TASK_SCHEDULED_KEY, `[[${dateValue}]]`],
      })
      .json<BaseLogseqBlock>()
  }
}
