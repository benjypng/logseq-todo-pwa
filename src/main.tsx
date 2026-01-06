import '@mantine/core/styles.css'
import '@fontsource/work-sans'

import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={{ fontFamily: 'Work Sans' }}>
        <App />
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
)
