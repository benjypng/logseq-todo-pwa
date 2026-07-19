import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { sendOutboxEntry } from '../api'
import {
  enqueueOp,
  flushOutbox,
  listEntries,
  type OutboxDB,
  type OutboxEntry,
  type OutboxOp,
  openOutbox,
} from '../lib/outbox'

interface OutboxValue {
  entries: OutboxEntry[]
  enqueue: (op: OutboxOp) => Promise<void>
}

const OutboxContext = createContext<OutboxValue | null>(null)

const FLUSH_INTERVAL_MS = 20_000

export function OutboxProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const dbRef = useRef<Promise<OutboxDB> | null>(null)
  const getDb = useCallback(() => {
    dbRef.current ??= openOutbox()
    return dbRef.current
  }, [])
  const [entries, setEntries] = useState<OutboxEntry[]>([])
  const flushing = useRef(false)

  const refresh = useCallback(async () => {
    setEntries(await listEntries(await getDb()))
  }, [getDb])

  const flush = useCallback(async () => {
    if (flushing.current) return
    flushing.current = true
    try {
      const { sent, dropped } = await flushOutbox(
        await getDb(),
        sendOutboxEntry,
      )
      if (sent > 0 || dropped > 0) {
        await queryClient.invalidateQueries({ queryKey: ['tasks'] })
      }
    } finally {
      flushing.current = false
      await refresh()
    }
  }, [getDb, queryClient, refresh])

  useEffect(() => {
    refresh()
    flush()
    const timer = setInterval(flush, FLUSH_INTERVAL_MS)
    window.addEventListener('online', flush)
    return () => {
      clearInterval(timer)
      window.removeEventListener('online', flush)
    }
  }, [flush, refresh])

  const enqueue = useCallback(
    async (op: OutboxOp) => {
      await enqueueOp(await getDb(), op, Date.now())
      await refresh()
      void flush()
    },
    [getDb, refresh, flush],
  )

  const value = useMemo(() => ({ entries, enqueue }), [entries, enqueue])

  return (
    <OutboxContext.Provider value={value}>{children}</OutboxContext.Provider>
  )
}

export function useOutbox(): OutboxValue {
  const ctx = useContext(OutboxContext)
  if (!ctx) throw new Error('useOutbox must be used within OutboxProvider')
  return ctx
}
