import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "300155415762-uo0o71jjg28i313djufo49jk3mfe527m.apps.googleusercontent.com"}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)