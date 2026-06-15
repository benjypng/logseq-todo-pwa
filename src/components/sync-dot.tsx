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

export function SyncDot({ enabled }: { enabled: boolean }) {
  const { data, isError, isLoading, isFetching } = useSyncStatus(enabled)

  // Hook still runs when disabled (enabled:false halts fetching); render nothing.
  if (!enabled) return null

  const state: SyncState = isError ? 'error' : (data?.state ?? 'error')
  const d = data?.detail

  const tooltip = isLoading
    ? 'Checking sync status…'
    : isError
      ? 'Sync status unavailable — is the sidecar running?'
      : [
          LABEL[state],
          d ? `ws: ${d['ws-state'] ?? '?'}` : null,
          d
            ? `pending: ${d['pending-local'] ?? 0}/${d['pending-server'] ?? 0}/${d['pending-asset'] ?? 0} (local/server/asset)`
            : null,
          d
            ? `tx: ${d['local-tx'] ?? '?'} local / ${d['remote-tx'] ?? '?'} remote`
            : null,
          data?.error ? `error: ${data.error}` : null,
        ]
          .filter(Boolean)
          .join('\n')

  return (
    <span
      className="flex items-center justify-center"
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
    </span>
  )
}
