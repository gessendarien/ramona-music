import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx'
import ToastContainer from './components/ToastContainer.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <NotificationProvider>
        <App />
        <ToastContainer />
      </NotificationProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
