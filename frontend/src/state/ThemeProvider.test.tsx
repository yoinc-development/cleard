import {render, waitFor} from '@testing-library/react'
import {afterEach, expect, test} from 'vitest'
import {ApiProvider} from '../api/ApiProvider'
import type {TransactionsApi} from '../api/TransactionsApi'
import type {AppSettings} from '../api/types'
import {THEME_STORAGE_KEY} from '../features/settings/themes'
import {SettingsContext} from './SettingsContext'
import {SettingsProvider} from './SettingsProvider'
import {ThemeProvider} from './ThemeProvider'

function renderWithSettings(getSettings: () => Promise<AppSettings>) {
    const api = {getSettings} as unknown as TransactionsApi
    return render(
        <ApiProvider api={api}>
            <SettingsProvider>
                <ThemeProvider><p>content</p></ThemeProvider>
            </SettingsProvider>
        </ApiProvider>,
    )
}

afterEach(() => {
    delete document.documentElement.dataset.theme
    localStorage.clear()
})

test('applies the theme from the settings to the document', () => {
    render(
        <SettingsContext
            value={{
                currency: 'CHF',
                locale: null,
                language: 'en',
                theme: 'sepia',
                activeAccountId: null,
                loaded: true,
                reload: () => Promise.resolve()
            }}>
            <ThemeProvider><p>content</p></ThemeProvider>
        </SettingsContext>,
    )

    expect(document.documentElement.dataset.theme).toBe('sepia')
})

test('applies the cached theme before the settings have loaded', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')

    renderWithSettings(() => new Promise(() => {
    }))

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
})

test('uses dark before the settings have loaded when nothing is cached', () => {
    renderWithSettings(() => new Promise(() => {
    }))

    expect(document.documentElement.dataset.theme).toBe('dark')
})

test('the stored setting wins over a stale cached theme', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')

    renderWithSettings(() => Promise.resolve({currency: 'CHF', locale: null, theme: 'sepia', activeAccountId: null}))

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('sepia'))
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('sepia')
})
