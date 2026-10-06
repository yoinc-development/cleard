import {createContext, use} from 'react'
import {DEFAULT_LANGUAGE} from '../features/settings/languages'
import {DEFAULT_THEME} from '../features/settings/themes'
import type {ThemeId} from '../features/settings/themes'

export const DEFAULT_CURRENCY = 'CHF'

export interface SettingsContextValue {
    currency: string
    locale: string | null
    language: string
    theme: ThemeId
    reload: () => Promise<void>
}

export const SettingsContext = createContext<SettingsContextValue>({
    currency: DEFAULT_CURRENCY,
    locale: null,
    language: DEFAULT_LANGUAGE,
    theme: DEFAULT_THEME,
    reload: () => Promise.resolve(),
})

export function useSettings(): SettingsContextValue {
    return use(SettingsContext)
}
