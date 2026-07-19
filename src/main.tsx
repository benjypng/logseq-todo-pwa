import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'

import { OutboxProvider } from './hooks/use-outbox'
import { createIdbPersister } from './lib/persister'
import { isIosStandalone, nudgeViewportStaggered } from './utils/ios-pwa'

const PERSIST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const PERSISTED_QUERY_KEYS = new Set(['tasks', 'graph'])

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: PERSIST_MAX_AGE_MS,
    },
  },
})

const persister = createIdbPersister()

if (isIosStandalone()) {
  nudgeViewportStaggered()
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) nudgeViewportStaggered()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE_MS,
        buster: 'v1',
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            defaultShouldDehydrateQuery(query) &&
            PERSISTED_QUERY_KEYS.has(String(query.queryKey[0])),
        },
      }}
    >
      <OutboxProvider>
        <App />
      </OutboxProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
)
