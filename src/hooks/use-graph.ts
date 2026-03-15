import { useQuery } from '@tanstack/react-query'

import { getCurrGraphName } from '../api'

export function useGraph() {
  return useQuery({
    queryKey: ['graph'],
    queryFn: getCurrGraphName,
    staleTime: Number.POSITIVE_INFINITY,
  })
}
