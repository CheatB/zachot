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
        
        // НЕ показываем уведомление на страницах генерации
        const isGenerationPage = window.location.pathname.includes('/generations/')
        
        if (isGenerationPage) {
          console.log('[SW] Skipping update notification on generation page')
          // Сохраняем флаг, что обновление доступно
          sessionStorage.setItem('updateAvailable', 'true')
          return
        }
        
        // Показываем неблокирующее уведомление
        const notification = document.createElement('div')
        notification.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: var(--color-accent-base, #16a34a);
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          gap: 12px;
          align-items: center;
          animation: slideIn 0.3s ease-out;
        `
        notification.innerHTML = `
          <span>Доступна новая версия!</span>
          <button id="update-btn" style="
            background: white;
            color: #16a34a;
            border: none;
            padding: 6px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
          ">Обновить</button>
          <button id="dismiss-btn" style="
            background: transparent;
            color: white;
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            opacity: 0.8;
          ">×</button>
        `
        
        document.body.appendChild(notification)
        
        document.getElementById('update-btn')?.addEventListener('click', () => {
          window.location.reload()
        })
        
        document.getElementById('dismiss-btn')?.addEventListener('click', () => {
          notification.remove()
        })
        
        // Автоматически скрыть через 10 секунд
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove()
          }
        }, 10000)
      }
    })
  })
}
