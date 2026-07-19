import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useCallback, useMemo } from 'react'

import { getTasksFromLogseq } from '../api'
import { isToday } from '../lib/date'
import { applyOutbox } from '../lib/merge'
import type { AddType, LogseqTask, Task } from '../types'
import { useOutbox } from './use-outbox'

function mapLogseqTaskToTask(logseqTask: LogseqTask): Task | null {
  if (logseqTask.status !== 'Todo' && logseqTask.status !== 'Doing') {
    return null
  }
  const title = logseqTask['full-title']
  if (
    !title ||
    title === '' ||
    title === 'All' ||
    title === 'Linked references' ||
    title === 'Errand' ||
    title === 'Waiting'
  ) {
    return null
  }
  return {
    uuid: logseqTask.uuid,
    displayText: title,
    status: logseqTask.status,
    scheduledDate: logseqTask.scheduledDate,
    deadline: logseqTask.deadline,
    isScheduledToday: isToday(logseqTask.scheduledDate),
    pageName:
      (logseqTask as unknown as { page?: { name?: string } }).page?.name ??
      'Unknown',
    taskType: logseqTask.taskType,
  }
}

export function useTasks() {
  const { entries } = useOutbox()
  const query = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasksFromLogseq,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    refetchInterval: 2000,
    staleTime: 0,
    retry: false,
    select: (data) => {
      const tasks: Task[] = []
      for (const logseqTask of data) {
        const task = mapLogseqTaskToTask(logseqTask)
        if (task) tasks.push(task)
      }
      return tasks
    },
  })

  const tasks = useMemo(
    () => applyOutbox(query.data ?? [], entries),
    [query.data, entries],
  )

  return {
    tasks,
    isLoading: query.isLoading,
    error: query.error ? String(query.error) : null,
    refetch: query.refetch,
  }
}

export function useAddTask() {
  const { enqueue } = useOutbox()
  return useCallback(
    (title: string, type: AddType) =>
      enqueue({ kind: 'add-task', title, type }),
    [enqueue],
  )
}

export function useSetStatus() {
  const { enqueue } = useOutbox()
  return useCallback(
    (uuid: string, status: 'Todo' | 'Doing' | 'Done') =>
      enqueue({ kind: 'set-status', uuid, status }),
    [enqueue],
  )
}

export function useToggleScheduleToday() {
  const { enqueue } = useOutbox()
  return useCallback(
    (uuid: string, clear: boolean) =>
      enqueue({
        kind: 'set-scheduled',
        uuid,
        scheduled: clear ? null : format(new Date(), 'yyyy-MM-dd'),
      }),
    [enqueue],
  )
}

export function useSetDeadline() {
  const { enqueue } = useOutbox()
  return useCallback(
    (uuid: string, date: Date | null) =>
      enqueue({
        kind: 'set-deadline',
        uuid,
        deadline: date === null ? null : format(date, 'yyyy-MM-dd'),
      }),
    [enqueue],
  )
}
