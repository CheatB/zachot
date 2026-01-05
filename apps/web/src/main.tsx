console.log('API_BASE_URL =', import.meta.env.VITE_API_BASE_URL);

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
