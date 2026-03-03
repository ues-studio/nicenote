import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'

import './index.css'

// 挂载 React 应用
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
