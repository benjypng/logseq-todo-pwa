import { format } from 'date-fns'
import wretch from 'wretch'

import { BASE_URL, TASK_PRIORITY_KEY, TASK_STATUS_KEY } from './constants'
import type {
  AddTaskMutationProps,
  BaseLogseqBlock,
  LogseqTask,
  Priority,
  TaskStatus,
} from './types'

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

export const getTasksFromLogseq = async (): Promise<LogseqTask[]> => {
  const allTasks = await api
    .post({
      method: 'logseq.DB.datascriptQuery',
      args: [
        `[:find (pull ?b [*]) ?status ?priority
          :where
            [?t :block/name "task"]
            [?b :block/refs ?t]
            (or
              (and
                [?b :logseq.property/status ?s]
                [?s :block/title ?status]
              )
              (and
                (not [?b :logseq.property/status])
                [(ground "Todo") ?status]
                [(ground -1) ?s]  
              )
            )
            [(!= ?status "Done")]
            (or
              (and
                [?b :logseq.property/priority ?p]
                [?p :block/title ?priority]
              )
              (and
                (not [?b :logseq.property/priority])
                [(ground "None") ?priority]
                [(ground -1) ?p] 
              )
            )
         ]`,
      ],
    })
    .json<[LogseqTask, TaskStatus, Priority][]>()

  const mappedTasks = allTasks.map(([logseqTask, taskStatus, priority]) => {
    return {
      ...logseqTask,
      status: taskStatus,
      priority: priority,
    }
  })

  return mappedTasks.flat()
}

export const addTaskToLogseq = async ({
  task,
  priority,
}: AddTaskMutationProps) => {
  const todayDate = format(new Date(), 'MMM do, yyyy')
  try {
    const createdBlock = await api
      .post({
        method: 'logseq.Editor.appendBlockInPage',
        args: [todayDate, task],
      })
      .json<BaseLogseqBlock>()
    await api
      .post({
        method: 'logseq.Editor.addBlockTag',
        args: [createdBlock.uuid, 'task'],
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
