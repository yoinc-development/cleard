import {useCallback, useEffect, useMemo, useState} from 'react'
import type {ReactNode} from 'react'
import {useApi} from '../api/ApiContext'
import {resolveLanguage} from '../features/settings/languages'
import {readCachedTheme, resolveTheme} from '../features/settings/themes'
import {DEFAULT_CURRENCY, SettingsContext} from './SettingsContext'
import type {SettingsContextValue} from './SettingsContext'

export function SettingsProvider({children}: { children: ReactNode }) {
    const api = useApi()
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
    const [locale, setLocale] = useState<string | null>(null)
    const [theme, setTheme] = useState<string | null>(readCachedTheme)
    const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
    const [loaded, setLoaded] = useState(false)

    const reload = useCallback(async () => {
        const settings = await api.getSettings()
        setCurrency(settings.currency)
        setLocale(settings.locale)
        setTheme(settings.theme)
        setActiveAccountId(settings.activeAccountId)
    }, [api])

    useEffect(() => {
        reload().catch(() => {
        }).finally(() => setLoaded(true))
    }, [reload])

    const value = useMemo<SettingsContextValue>(
        () => ({
            currency,
            locale,
            language: resolveLanguage(locale),
            theme: resolveTheme(theme),
            activeAccountId,
            loaded,
            reload
        }),
        [currency, locale, theme, activeAccountId, loaded, reload],
    )

    return <SettingsContext value={value}>{children}</SettingsContext>
}
