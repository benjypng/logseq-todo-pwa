import { format } from 'date-fns'
import wretch from 'wretch'

import {
  BASE_URL_API_CLI,
  GET_ERRANDS_FROM_LOGSEQ,
  GET_TASKS_FROM_LOGSEQ,
} from './constants'
import type {
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
  .url(BASE_URL_API_CLI)
  .headers({ 'Content-Type': 'application/json' })
  .catcherFallback((error: unknown) => {
    console.error('Sidecar API Error:', error)
    throw error
  })

export const getCurrGraphName = async (): Promise<string> => {
  const { name } = await api.url('/graph').get().json<{ name: string }>()
  return name
}

const runQuery = async (
  edn: string,
): Promise<[RawLogseqTask, TaskStatus, Priority, string][]> =>
  api
    .url('/query')
    .post({ edn })
    .json<[RawLogseqTask, TaskStatus, Priority, string][]>()

export const getTasksFromLogseq = async (): Promise<LogseqTask[]> => {
  const [allTasks, allErrands] = await Promise.all([
    runQuery(GET_TASKS_FROM_LOGSEQ),
    runQuery(GET_ERRANDS_FROM_LOGSEQ),
  ])

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
        task['full-title'] as string | undefined,
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

const setStatus = (uuid: string, status: TaskStatus) =>
  api.url('/task/status').patch({ uuid, status }).res()

export const markTaskAsDone = (uuid: string) => setStatus(uuid, 'Done')
export const markTaskAsDoing = (uuid: string) => setStatus(uuid, 'Doing')
export const markTaskAsTodo = (uuid: string) => setStatus(uuid, 'Todo')

export const addTaskToLogseq = async ({
  title,
  type,
}: {
  title: string
  type: 'task' | 'Errand' | 'Inbox'
}) => {
  const page = format(new Date(), 'MMM do, yyyy')
  await api.url('/task').post({ title, type, page }).res()
}

export const moveTaskToDate = async ({ uuid, date }: MoveTaskProps) => {
  const scheduled = date === null ? null : format(date, 'yyyy-MM-dd')
  await api.url('/task/scheduled').patch({ uuid, scheduled }).res()
}

export const setTaskDeadline = async ({ uuid, date }: SetDeadlineProps) => {
  const deadline = date === null ? null : format(date, 'yyyy-MM-dd')
  await api.url('/task/deadline').patch({ uuid, deadline }).res()
}
