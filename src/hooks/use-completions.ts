import { useCallback, useEffect, useState } from 'react'

import {
  addCompletion,
  COMPLETIONS_STORAGE_KEY,
  type CompletionRecord,
  loadCompletions,
  pruneCompletions,
  removeCompletion,
  saveCompletions,
} from '../lib/completions'

export function useCompletions() {
  const [records, setRecords] = useState<CompletionRecord[]>(() =>
    pruneCompletions(loadCompletions(), new Date()),
  )

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === COMPLETIONS_STORAGE_KEY) setRecords(loadCompletions())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback(
    (fn: (prev: CompletionRecord[]) => CompletionRecord[]) => {
      setRecords((prev) => {
        const next = fn(prev)
        saveCompletions(next)
        return next
      })
    },
    [],
  )

  const complete = useCallback(
    (record: CompletionRecord) => update((rs) => addCompletion(rs, record)),
    [update],
  )

  const uncomplete = useCallback(
    (uuid: string) => update((rs) => removeCompletion(rs, uuid)),
    [update],
  )

  return { records, complete, uncomplete }
}
