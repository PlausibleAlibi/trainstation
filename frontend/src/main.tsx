import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './AppRouter'
import ErrorBoundary from './shared/ErrorBoundary.tsx'
import { log } from './shared/logging.ts'

// Log application startup
log.info('Application starting up', {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  </React.StrictMode>,
)