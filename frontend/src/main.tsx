import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {HashRouter} from 'react-router'
import './i18n'
import './styles/tokens.css'
import {ApiProvider} from './api/ApiProvider.tsx'
import {httpApi} from './api/httpApi.ts'
import {I18nProvider} from './i18n/I18nProvider.tsx'
import {MonthProvider} from './state/MonthProvider.tsx'
import {SettingsProvider} from './state/SettingsProvider.tsx'
import App from './App.tsx'

// TODO: GET /api/tags is not implemented yet; tag filtering 404s until it lands.
document.addEventListener('contextmenu', (event) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, [contenteditable="true"]')) return
    event.preventDefault()
})

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ApiProvider api={httpApi}>
            <SettingsProvider>
                <I18nProvider>
                    <MonthProvider>
                        <HashRouter>
                            <App/>
                        </HashRouter>
                    </MonthProvider>
                </I18nProvider>
            </SettingsProvider>
        </ApiProvider>
    </StrictMode>,
)
