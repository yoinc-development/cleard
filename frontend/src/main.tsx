import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './styles/tokens.css'
import { ApiProvider } from './api/ApiProvider.tsx'
import { httpApi } from './api/httpApi.ts'
import { MonthProvider } from './state/MonthProvider.tsx'
import App from './App.tsx'

//TODO GET /api/transactions and GET /api/categories are implemented; tags,
// month summary and create still 404 until their controllers land.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApiProvider api={httpApi}>
      <MonthProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </MonthProvider>
    </ApiProvider>
  </StrictMode>,
)
