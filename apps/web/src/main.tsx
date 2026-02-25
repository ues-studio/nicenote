import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './i18n'

import { QueryClientProvider } from '@tanstack/react-query'

import { ErrorBoundary } from './components/ErrorBoundary'
import { queryClient } from './lib/query-client'
import App from './App'

import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
)
