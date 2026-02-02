import { format } from 'date-fns'
import wretch from 'wretch'

import {
  BASE_URL,
  EXPENSE_VALUE_KEY,
  GET_ERRANDS_FROM_LOGSEQ,
  GET_TASKS_FROM_LOGSEQ,
  TASK_PRIORITY_KEY,
  TASK_SCHEDULED_KEY,
  TASK_STATUS_KEY,
} from './constants'
import {
  type AddExpenseMutationProps,
  type AddTaskMutationProps,
  type BaseLogseqBlock,
  type Expense,
  type LogseqGraph,
  type LogseqTask,
  type Priority,
  type TaskStatus,
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
  .catcherFallback((error: any) => {
    console.error('Global API Error:', error.status, error.text)
    throw error
  })

export const getCurrGraphName = async () => {
  const currGraph = await api
    .post({
      method: 'logseq.App.getCurrentGraph',
      args: [],
    })
    .json<LogseqGraph>()
  const graphName = currGraph.name.replace('logseq_db_', '')
  return graphName
}

export const getExpensesFromLogseq = async (): Promise<Expense[]> => {
  const allExpenses = await api
    .post({
      method: 'logseq.DB.datascriptQuery',
      args: [
        `[:find ?created-at ?title ?cost
        :where
          [?tag :block/name "expense"]
          [?b :block/refs ?tag]
          [?b :block/created-at ?created-at]
          [?b :block/title ?title]
          (or
            (and
              [?b :user.property/cost-CAE_NF1n ?prop-ref]
              [?prop-ref :logseq.property/value ?cost]
            )
            (and
              [(ground -1) ?prop-ref]
              [(ground 0) ?cost]
            )
          )]]`,
      ],
    })
    .json<[number, string, number][]>()

  const mappedExpenses = allExpenses.map(([createdAt, label, value]) => ({
    label: label,
    value: value,
    createdAt: createdAt,
  }))
  return mappedExpenses
}

export const addExpenseToLogseq = async ({
  label,
  value,
}: AddExpenseMutationProps) => {
  const todayDate = format(new Date(), 'MMM do, yyyy')
  try {
    const createdBlock = await api
      .post({
        method: 'logseq.Editor.appendBlockInPage',
        args: [todayDate, label],
      })
      .json<BaseLogseqBlock>()
    await api
      .post({
        method: 'logseq.Editor.addBlockTag',
        args: [createdBlock.uuid, 'expense'],
      })
      .json<BaseLogseqBlock>()
    await api
      .post({
        method: 'logseq.Editor.upsertBlockProperty',
        args: [createdBlock.uuid, EXPENSE_VALUE_KEY, value],
      })
      .json<BaseLogseqBlock>()
  } catch (e) {
    console.error(e)
  }
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

      // Get journal date from page.journal-day (YYYYMMDD format)
      const page = task.page as { 'journal-day'?: number } | undefined
      const journalDay = page?.['journal-day'] ?? null
      const journalDate = parseJournalDay(journalDay)

      // Get scheduled date from :logseq.property/scheduled (timestamp in ms)
      const scheduledTimestamp = task[':logseq.property/scheduled'] as
        | number
        | undefined
      const scheduledDate = scheduledTimestamp
        ? new Date(scheduledTimestamp)
        : null

      // Effective date: use scheduled if exists, otherwise journal date
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

export const addTaskToLogseq = async ({
  task,
  priority,
  type,
  date,
}: AddTaskMutationProps) => {
  const targetPageDate = date
    ? format(date, 'MMM do, yyyy')
    : format(new Date(), 'MMM do, yyyy')
  try {
    const createdBlock = await api
      .post({
        method: 'logseq.Editor.appendBlockInPage',
        args: [targetPageDate, task],
      })
      .json<BaseLogseqBlock>()
    await api
      .post({
        method: 'logseq.Editor.addBlockTag',
        args: [createdBlock.uuid, type],
      })
      .json<BaseLogseqBlock>()
    await api
      .post({
        method: 'logseq.Editor.upsertBlockProperty',
        args: [createdBlock.uuid, TASK_PRIORITY_KEY, priority],
      })
      .json<BaseLogseqBlock>()
  } catch (e) {
    console.error(e)
  }
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

export interface MoveTaskProps {
  uuid: string
  date: Date | null
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
    const dateValue = format(date, 'yyyy-MM-dd')
    await api
      .post({
        method: 'logseq.Editor.upsertBlockProperty',
        args: [uuid, TASK_SCHEDULED_KEY, `[[${dateValue}]]`],
      })
      .json<BaseLogseqBlock>()
  }
}
