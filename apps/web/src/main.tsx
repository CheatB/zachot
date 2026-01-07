import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './styles/tokens.css'
import './styles/globals.css'
import 'katex/dist/katex.min.css'

import App from './app/App'
import { AuthProvider } from './app/auth/authContext'
import AppErrorBoundary from './app/errors/AppErrorBoundary'
import AppBoundary from './app/AppBoundary'
import { ToastProvider } from './ui/primitives/Toast'

console.log('[main.tsx] ====== STARTING APP ======')

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

console.log('[main.tsx] Root element found, creating root...')

const root = ReactDOM.createRoot(rootElement)

console.log('[main.tsx] Rendering app with providers...')
console.log('[main.tsx] Structure: AppErrorBoundary -> AuthProvider -> AppBoundary -> BrowserRouter -> App')

root.render(
  <AppErrorBoundary>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppBoundary>
            <App />
          </AppBoundary>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </AppErrorBoundary>
)

console.log('[main.tsx] Render called')
