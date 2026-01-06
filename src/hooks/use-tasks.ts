import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addTaskToLogseq,
  getTasksFromLogseq,
  markTaskAsDoing,
  markTaskAsDone,
} from '../api'
import { PRIORITY_WEIGHT } from '../constants'

export const useTodos = () => {
  return useQuery({
    queryKey: ['todos'],
    queryFn: getTasksFromLogseq,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    refetchInterval: 2000,
    staleTime: 0,
    select: (data) =>
      data
        .sort(
          (a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority],
        )
        .filter((item) => item['full-title'] !== '')
        .filter((item) => item['full-title'] !== 'All')
        .filter((item) => item['full-title'] !== 'Linked references'),
  })
}

export const useAddTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addTaskToLogseq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

export const useDoneTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markTaskAsDone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

export const useDoingTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markTaskAsDoing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}
