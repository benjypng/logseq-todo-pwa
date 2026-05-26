import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient()

// iOS standalone PWA cold-start workaround:
// env(safe-area-inset-*) can be wrong until WebKit recomputes them.
// Briefly toggling viewport-fit forces recalculation without device rotation.
// See: https://gist.github.com/fozzedout/5e77925381991a9570151550992baf14
const nudgeViewport = () => {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
  if (!meta) return
  const original = meta.getAttribute('content') ?? ''
  if (!original.includes('viewport-fit=cover')) return
  meta.setAttribute(
    'content',
    original.replace('viewport-fit=cover', 'viewport-fit=auto'),
  )
  requestAnimationFrame(() => {
    meta.setAttribute('content', original)
  })
}

const nav = window.navigator as Navigator & { standalone?: boolean }
if (nav.standalone) {
  nudgeViewport()
  setTimeout(nudgeViewport, 100)
  setTimeout(nudgeViewport, 500)
  setTimeout(nudgeViewport, 1000)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
