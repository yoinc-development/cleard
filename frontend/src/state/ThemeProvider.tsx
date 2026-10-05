import {useEffect} from 'react'
import type {ReactNode} from 'react'
import {applyTheme} from '../features/settings/themes'
import {useSettings} from './SettingsContext'

export function ThemeProvider({children}: { children: ReactNode }) {
    const {theme} = useSettings()

    useEffect(() => {
        applyTheme(theme)
    }, [theme])

    return children
}
