import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { addTaskToLogseq, getTasksFromLogseq } from '../api'
import { isToday } from '../lib/date'
import type { LogseqTask, Task, TaskType } from '../types'

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
    mutationFn: ({ title, type }: { title: string; type: TaskType }) =>
      addTaskToLogseq({ title, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
