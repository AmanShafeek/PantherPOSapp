import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Browser Mocks for Preview
if (typeof window !== 'undefined' && !window.electronAPI) {
  (window as any).electronAPI = {
    dbQuery: async (sql: string) => {
      console.log('[Mock DB] Query:', sql);
      return [];
    },
    openWindow: async (path: string) => {
      console.log('[Mock Window] Opening:', path);
      window.open(window.location.origin + window.location.pathname + '#' + path, '_blank', 'width=1000,height=700');
    },
    printRaw: async () => ({ success: true }),
    scaleReadWeight: async () => ({ success: true, weight: 1.25 })
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
