import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@fontsource/work-sans'

import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import { AuthGate } from './components/AuthGate'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        theme={{
          fontFamily: 'Work Sans',
          primaryColor: 'gray',
          colors: {
            gray: [
              '#f8f9fa',
              '#f1f3f5',
              '#e9ecef',
              '#dee2e6',
              '#ced4da',
              '#adb5bd',
              '#868e96',
              '#495057',
              '#343a40',
              '#212529',
            ],
          },
        }}
        defaultColorScheme="auto"
      >
        <AuthGate>
          <App />
        </AuthGate>
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
)
