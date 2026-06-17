import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter } from 'react-router-dom'
import { ToastProvider } from '@/context/ToastContext'
import { AuthProvider } from '@/context/AuthContext'
import App from './App'
import './styles/globals.css'

// ─── Render cold-start warm-up ping ──────────────────────────────────────────
// The free-tier Render backend spins down after 15 min of inactivity.
// Fire a silent ping the moment the JS bundle loads so the container starts
// warming up before the user even navigates to a data page.
// Only runs on production (VITE_API_URL is only set in .env.production).
if (import.meta.env.VITE_API_URL &&
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1') {
  fetch(`${import.meta.env.VITE_API_URL}/`).catch(() => {/* ignore — fire and forget */});
}
// ─────────────────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Show cached data instantly; re-fetch silently in background after 5 min
      staleTime: 1000 * 60 * 5,
      // Retry failed requests up to 2 times with exponential back-off
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15000),
      // Don't re-fetch when the tab comes back into focus (avoids churn)
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
