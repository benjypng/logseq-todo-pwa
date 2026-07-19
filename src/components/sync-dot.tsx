import { useSyncExternalStore } from 'react'

import { useOutbox } from '../hooks/use-outbox'
import { useSyncStatus } from '../hooks/use-sync-status'
import { cn } from '../lib/utils'
import type { SyncState } from '../types'

const DOT_COLOR: Record<SyncState, string> = {
  synced: 'bg-sync-ok',
  pending: 'bg-sync-pending',
  error: 'bg-sync-error',
}

const DOT_RING: Record<SyncState, string> = {
  synced: '0 0 0 3px rgba(61,187,107,.16)',
  pending: '0 0 0 3px rgba(234,140,28,.16)',
  error: '0 0 0 3px rgba(194,65,12,.16)',
}

const LABEL: Record<SyncState, string> = {
  synced: 'In sync',
  pending: 'Pending changes',
  error: 'Sync error',
}

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine)
}

export function SyncDot({ enabled }: { enabled: boolean }) {
  const { data, isError, isLoading, isFetching } = useSyncStatus(enabled)
  const { entries } = useOutbox()
  const online = useOnline()
  const queued = entries.length

  // Hook still runs when disabled (enabled:false halts fetching); render nothing.
  if (!enabled) return null

  const state: SyncState =
    !online || queued > 0
      ? 'pending'
      : isError
        ? 'error'
        : (data?.state ?? 'error')
  const d = data?.detail

  const tooltip = [
    !online ? 'Offline — changes will sync when back online' : null,
    queued > 0 ? `${queued} queued change${queued === 1 ? '' : 's'}` : null,
    online && isLoading ? 'Checking sync status…' : null,
    online && !isLoading && isError
      ? 'Sync status unavailable — is the sidecar running?'
      : null,
    online && !isLoading && !isError ? LABEL[state] : null,
    online && !isLoading && !isError && d
      ? `ws: ${d['ws-state'] ?? '?'}`
      : null,
    online && !isLoading && !isError && d
      ? `pending: ${d['pending-local'] ?? 0}/${d['pending-server'] ?? 0}/${d['pending-asset'] ?? 0} (local/server/asset)`
      : null,
    online && !isLoading && !isError && d
      ? `tx: ${d['local-tx'] ?? '?'} local / ${d['remote-tx'] ?? '?'} remote`
      : null,
    data?.error ? `error: ${data.error}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <span
      className="flex items-center justify-center gap-1.5"
      title={tooltip}
      aria-label={tooltip}
    >
      <span
        className={cn(
          'h-[11px] w-[11px] rounded-full',
          DOT_COLOR[state],
          isFetching && 'animate-pulse',
        )}
        style={{ boxShadow: DOT_RING[state] }}
      />
      {queued > 0 && (
        <span className="text-[12px] font-semibold text-muted-foreground">
          {queued}
        </span>
      )}
    </span>
  )
}
