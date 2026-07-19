import type {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client'
import { type IDBPDatabase, openDB } from 'idb'

const STORE = 'cache'
const KEY = 'client'

export function createIdbPersister(dbName = 'todo-query-cache'): Persister {
  let dbPromise: Promise<IDBPDatabase> | null = null
  const db = () => {
    dbPromise ??= openDB(dbName, 1, {
      upgrade(d) {
        d.createObjectStore(STORE)
      },
    })
    return dbPromise
  }

  return {
    async persistClient(client: PersistedClient) {
      await (await db()).put(STORE, client, KEY)
    },
    async restoreClient() {
      return (await (await db()).get(STORE, KEY)) as PersistedClient | undefined
    },
    async removeClient() {
      await (await db()).delete(STORE, KEY)
    },
  }
}
