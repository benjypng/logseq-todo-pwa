import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'

import { isIosStandalone, nudgeViewportStaggered } from './utils/ios-pwa'

const queryClient = new QueryClient()

if (isIosStandalone()) {
  nudgeViewportStaggered()
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) nudgeViewportStaggered()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
