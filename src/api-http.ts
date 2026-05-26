import { format, startOfDay } from 'date-fns'
import wretch from 'wretch'

import {
  BASE_URL_API_HTTP,
  GET_ERRANDS_FROM_LOGSEQ,
  GET_TASKS_FROM_LOGSEQ,
  TASK_DEADLINE_KEY,
  TASK_SCHEDULED_KEY,
  TASK_STATUS_KEY,
} from './constants'
import type {
  BaseLogseqBlock,
  LogseqGraph,
  LogseqTask,
  MoveTaskProps,
  Priority,
  RawLogseqTask,
  SetDeadlineProps,
  TaskStatus,
} from './types'
import { computeEffectiveDate, parseJournalDay } from './utils/date-utils'
import { resolveTitleRefs } from './utils/resolve-refs'

const api = wretch()
  .url(BASE_URL_API_HTTP)
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

  return allTasks
    .concat(allErrands)
    .map(([logseqTask, taskStatus, priority, tagName]) => {
      const task = logseqTask as unknown as Record<string, unknown>

      const page = task.page as { 'journal-day'?: number } | undefined
      const journalDay = page?.['journal-day'] ?? null
      const journalDate = parseJournalDay(journalDay)

      const scheduledTimestamp = task[':logseq.property/scheduled'] as
        | number
        | undefined
      const scheduledDate = scheduledTimestamp
        ? new Date(scheduledTimestamp)
        : null

      const deadlineTimestamp = task[':logseq.property/deadline'] as
        | number
        | undefined
      const deadline = deadlineTimestamp ? new Date(deadlineTimestamp) : null

      const effectiveDate = computeEffectiveDate(journalDate, scheduledDate)

      const resolvedTitle = resolveTitleRefs(
        (task['full-title'] ?? task.title) as string | undefined,
        task.refs,
      )

      return {
        ...logseqTask,
        'full-title': resolvedTitle,
        status: taskStatus,
        priority: priority,
        taskType: tagName as 'task' | 'Errand',
        journalDate,
        scheduledDate,
        deadline,
        effectiveDate,
      }
    })
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
    const epoch = startOfDay(date).getTime()
    await api
      .post({
        method: 'logseq.Editor.upsertBlockProperty',
        args: [uuid, TASK_SCHEDULED_KEY, epoch],
      })
      .json<BaseLogseqBlock>()
  }
}

export const setTaskDeadline = async ({ uuid, date }: SetDeadlineProps) => {
  if (date === null) {
    await api
      .post({
        method: 'logseq.Editor.removeBlockProperty',
        args: [uuid, TASK_DEADLINE_KEY],
      })
      .json()
  } else {
    const epoch = startOfDay(date).getTime()
    await api
      .post({
        method: 'logseq.Editor.upsertBlockProperty',
        args: [uuid, TASK_DEADLINE_KEY, epoch],
      })
      .json<BaseLogseqBlock>()
  }
}
