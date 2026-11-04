import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Registrasi Service Worker PWA agar aplikasi tetap berjalan saat offline & tidak muncul Dino Game
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const basePath = (import.meta as any).env?.BASE_URL || './'
    const swUrl = new URL('sw.js', new URL(basePath, window.location.href)).href
    navigator.serviceWorker.register(swUrl).catch((err) => {
      console.warn('[SW] Registration failed:', err)
    })
  })
}
