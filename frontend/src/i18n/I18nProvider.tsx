import {useEffect} from 'react'
import type {ReactNode} from 'react'
import {I18nextProvider} from 'react-i18next'
import {useSettings} from '../state/SettingsContext'
import i18n from './index'

export function I18nProvider({children}: { children: ReactNode }) {
    const {language} = useSettings()

    useEffect(() => {
        if (i18n.language !== language) void i18n.changeLanguage(language)
    }, [language])

    useEffect(() => {
        document.documentElement.lang = language
    }, [language])

    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
