import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { addExpenseToLogseq, getExpensesFromLogseq } from '../api'

export const useExpense = () => {
  return useQuery({
    queryKey: ['expense'],
    queryFn: getExpensesFromLogseq,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    refetchInterval: 2000,
    staleTime: 0,
    select: (data) =>
      [...data]
        .filter((item) => item.value !== 0)
        .sort((a, b) => b.createdAt - a.createdAt),
  })
}

export const useAddExpense = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addExpenseToLogseq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}
