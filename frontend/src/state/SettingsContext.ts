import {createContext, use} from 'react'
import {DEFAULT_LANGUAGE} from '../features/settings/languages'

export const DEFAULT_CURRENCY = 'CHF'

export interface SettingsContextValue {
    currency: string
    locale: string | null
    language: string
    reload: () => Promise<void>
}

export const SettingsContext = createContext<SettingsContextValue>({
    currency: DEFAULT_CURRENCY,
    locale: null,
    language: DEFAULT_LANGUAGE,
    reload: () => Promise.resolve(),
})

export function useSettings(): SettingsContextValue {
    return use(SettingsContext)
}
