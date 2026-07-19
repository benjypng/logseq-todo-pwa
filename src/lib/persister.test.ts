import type { PersistedClient } from '@tanstack/react-query-persist-client'

import { createIdbPersister } from './persister'
import { describe, expect, test } from 'bun:test'

let dbCounter = 0
const freshPersister = () => createIdbPersister(`test-cache-${++dbCounter}`)

const client = (): PersistedClient => ({
  timestamp: 123,
  buster: 'v1',
  clientState: {
    mutations: [],
    queries: [
      {
        queryKey: ['tasks'],
        queryHash: '["tasks"]',
        state: {
          data: [{ uuid: 'u1', scheduledDate: new Date(2026, 6, 19) }],
          dataUpdateCount: 1,
          dataUpdatedAt: 123,
          error: null,
          errorUpdateCount: 0,
          errorUpdatedAt: 0,
          fetchFailureCount: 0,
          fetchFailureReason: null,
          fetchMeta: null,
          isInvalidated: false,
          status: 'success',
          fetchStatus: 'idle',
        },
      },
    ],
  },
})

describe('createIdbPersister', () => {
  test('round-trips a persisted client with Date values intact', async () => {
    const persister = freshPersister()
    await persister.persistClient(client())

    const restored = await persister.restoreClient()
    expect(restored?.buster).toBe('v1')
    const data = restored?.clientState.queries[0].state.data as {
      scheduledDate: unknown
    }[]
    expect(data[0].scheduledDate).toBeInstanceOf(Date)
  })

  test('restores undefined when nothing was persisted', async () => {
    const persister = freshPersister()
    expect(await persister.restoreClient()).toBeUndefined()
  })

  test('removeClient clears the persisted state', async () => {
    const persister = freshPersister()
    await persister.persistClient(client())
    await persister.removeClient()
    expect(await persister.restoreClient()).toBeUndefined()
  })
})
