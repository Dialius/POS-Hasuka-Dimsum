import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Pastikan favicon selalu menggunakan logo brand Hasuka
const HASUKA_FAVICON = 'https://raw.githubusercontent.com/Dialius/POS-Hasuka-Dimsum/main/Hasuka-logo.png';
try {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = HASUKA_FAVICON;
} catch (_) {}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
