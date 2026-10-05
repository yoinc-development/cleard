import {render} from '@testing-library/react'
import {afterEach, expect, test} from 'vitest'
import {SettingsContext} from './SettingsContext'
import {ThemeProvider} from './ThemeProvider'

afterEach(() => {
    delete document.documentElement.dataset.theme
    localStorage.clear()
})

test('applies the theme from the settings to the document', () => {
    render(
        <SettingsContext
            value={{currency: 'CHF', locale: null, language: 'en', theme: 'sepia', reload: () => Promise.resolve()}}>
            <ThemeProvider><p>content</p></ThemeProvider>
        </SettingsContext>,
    )

    expect(document.documentElement.dataset.theme).toBe('sepia')
})
