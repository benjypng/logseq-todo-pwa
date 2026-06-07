import { useQuery } from '@tanstack/react-query'
import wretch from 'wretch'

import { BASE_URL_API_CLI } from '../constants'
import type { SyncStatus } from '../types'

// Sync status is a db-sync (CLI) concept, so this only runs on the CLI backend.
// Polls gently (each call spawns a `logseq` process) plus refetches on focus,
// which covers the common "check it when I open the PWA" case. A failed fetch
// is left to surface as the error state by the consumer.
export function useSyncStatus(enabled: boolean) {
  return useQuery({
    queryKey: ['sync-status'],
    queryFn: () =>
      wretch(`${BASE_URL_API_CLI}/sync/status`).get().json<SyncStatus>(),
    enabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    refetchInterval: 30_000,
    staleTime: 10_000,
    retry: false,
  })
}
