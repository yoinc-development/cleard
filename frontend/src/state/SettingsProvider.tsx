import {useCallback, useEffect, useMemo, useState} from 'react'
import type {ReactNode} from 'react'
import {useApi} from '../api/ApiContext'
import {DEFAULT_CURRENCY, SettingsContext} from './SettingsContext'
import type {SettingsContextValue} from './SettingsContext'

export function SettingsProvider({children}: { children: ReactNode }) {
    const api = useApi()
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY)

    const reload = useCallback(async () => {
        try {
            const settings = await api.getSettings()
            setCurrency(settings.currency)
        } catch {
        }
    }, [api])

    useEffect(() => {
        void reload()
    }, [reload])

    const value = useMemo<SettingsContextValue>(() => ({currency, reload}), [currency, reload])

    return <SettingsContext value={value}>{children}</SettingsContext>
}
