import {render, screen, waitFor} from '@testing-library/react'
import {useTranslation} from 'react-i18next'
import {describe, expect, test} from 'vitest'
import {SettingsContext} from '../state/SettingsContext'
import i18n from './index'
import {I18nProvider} from './I18nProvider'
import {registerTestGerman} from './testing'

function Probe() {
    const {t} = useTranslation()
    return <p>{t('settings.language.system_default', {language: 'X'})}</p>
}

function renderWithLanguage(language: string) {
    return render(
        <SettingsContext value={{currency: 'CHF', locale: language, language, reload: () => Promise.resolve()}}>
            <I18nProvider>
                <Probe/>
            </I18nProvider>
        </SettingsContext>,
    )
}

describe('I18nProvider', () => {
    registerTestGerman()

    test('renders texts in the resolved language and interpolates values', async () => {
        renderWithLanguage('de')
        expect(await screen.findByText('Systemstandard (X)')).toBeInTheDocument()
        expect(document.documentElement.lang).toBe('de')
    })

    test('renders English for en', async () => {
        renderWithLanguage('en')
        await waitFor(() => expect(screen.getByText('System default (X)')).toBeInTheDocument())
    })

    test('falls back to English for a blank or missing translation', async () => {
        await i18n.changeLanguage('de')
        expect(i18n.t('settings.language.description')).toBe('By default the app follows your system language.')
    })
})
