import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import { GameProvider } from './game/store.jsx'
import { SyncProvider } from './sync/SyncProvider.jsx'
import './styles.css'

registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameProvider>
      <SyncProvider>
        <App />
      </SyncProvider>
    </GameProvider>
  </React.StrictMode>,
)
