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

// Регистрация Service Worker для автоматического обновления
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered successfully:', registration.scope)
        
        // Проверяем обновления каждую минуту
        setInterval(() => {
          registration.update()
        }, 60000)
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error)
      })
    
    // Слушаем сообщения от Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'UPDATE_AVAILABLE') {
        console.log('[SW] Update available, version:', event.data.version)
        
        // Показываем уведомление пользователю
        const shouldReload = confirm(
          'Доступна новая версия приложения! Обновить страницу для применения изменений?'
        )
        
        if (shouldReload) {
          window.location.reload()
        }
      }
    })
  })
}
