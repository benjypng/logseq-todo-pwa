import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { startOfDay } from 'date-fns'

import {
  addTaskToLogseq,
  getTasksFromLogseq,
  markTaskAsDone,
  moveTaskToDate,
  setTaskDeadline,
} from '../api'
import { isToday } from '../lib/date'
import type { AddType, LogseqTask, Task, TaskType } from '../types'

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
  const query = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasksFromLogseq,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    refetchInterval: 2000,
    staleTime: 0,
    select: (data) => {
      const tasks: Task[] = []
      for (const logseqTask of data) {
        const task = mapLogseqTaskToTask(logseqTask)
        if (task) tasks.push(task)
      }
      return tasks
    },
  })

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? String(query.error) : null,
    refetch: query.refetch,
  }
}

export function useAddTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ title, type }: { title: string; type: AddType }) =>
      addTaskToLogseq({ title, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useMarkDone() {
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    string,
    { previous: LogseqTask[] | undefined }
  >({
    mutationFn: async (uuid: string) => {
      await markTaskAsDone(uuid)
    },
    onMutate: async (uuid) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueryData<LogseqTask[]>(['tasks'])
      queryClient.setQueryData<LogseqTask[]>(['tasks'], (old) =>
        old ? old.filter((t) => t.uuid !== uuid) : old,
      )
      return { previous }
    },
    onError: (_err, _uuid, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['tasks'], ctx.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useToggleScheduleToday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, clear }: { uuid: string; clear: boolean }) =>
      moveTaskToDate({
        uuid,
        date: clear ? null : startOfDay(new Date()),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useSetDeadline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, date }: { uuid: string; date: Date | null }) =>
      setTaskDeadline({ uuid, date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
