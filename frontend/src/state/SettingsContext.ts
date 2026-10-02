import {createContext, use} from 'react'

export const DEFAULT_CURRENCY = 'CHF'

export interface SettingsContextValue {
    currency: string
    reload: () => Promise<void>
}

export const SettingsContext = createContext<SettingsContextValue>({
    currency: DEFAULT_CURRENCY,
    reload: () => Promise.resolve(),
})

export function useSettings(): SettingsContextValue {
    return use(SettingsContext)
}
