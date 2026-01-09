import ReactDOM from 'react-dom/client'

import './styles/tokens.css'
import './styles/globals.css'
import 'katex/dist/katex.min.css'

import App from './app/App'
import AppErrorBoundary from './app/errors/AppErrorBoundary'

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
    <App />
  </AppErrorBoundary>
)

console.log('[main.tsx] Render called')
