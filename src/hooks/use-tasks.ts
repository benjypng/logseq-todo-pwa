import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasksFromLogseq, addTaskToLogseq, markTaskAsDone } from '../api'

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
        .sort((a, b) => b.status.localeCompare(a.status))
        .filter((item) => item.status === 'Todo')
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
