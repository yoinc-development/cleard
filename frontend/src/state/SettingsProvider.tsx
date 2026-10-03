import {useCallback, useEffect, useMemo, useState} from 'react'
import type {ReactNode} from 'react'
import {useApi} from '../api/ApiContext'
import {resolveLanguage} from '../features/settings/languages'
import {DEFAULT_CURRENCY, SettingsContext} from './SettingsContext'
import type {SettingsContextValue} from './SettingsContext'

export function SettingsProvider({children}: { children: ReactNode }) {
    const api = useApi()
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
    const [locale, setLocale] = useState<string | null>(null)

    const reload = useCallback(async () => {
        const settings = await api.getSettings()
        setCurrency(settings.currency)
        setLocale(settings.locale)
    }, [api])

    useEffect(() => {
        reload().catch(() => {
        })
    }, [reload])

    const value = useMemo<SettingsContextValue>(
        () => ({currency, locale, language: resolveLanguage(locale), reload}),
        [currency, locale, reload],
    )

    return <SettingsContext value={value}>{children}</SettingsContext>
}
