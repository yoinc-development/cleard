import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, test, vi} from 'vitest'
import i18n from '../../i18n'
import {registerTestGerman} from '../../i18n/testing'
import {SettingsContext} from '../../state/SettingsContext'
import type {ChangelogEntry} from './changelog'
import {WhatsNewDialog} from './WhatsNewDialog'

registerTestGerman()

const ENTRY: ChangelogEntry = {
    version: '1.2.0',
    date: '2026-09-25',
    sections: [
        {type: 'new', items: {en: ['Tags for transactions'], de: ['Tags für Transaktionen']}},
        {type: 'fixed', items: {en: ['Faster startup'], de: ['Schnellerer Start']}},
    ],
}

function renderDialog(language: string, onClose = vi.fn()) {
    render(
        <SettingsContext
            value={{
                currency: 'CHF',
                locale: language,
                language,
                theme: 'dark',
                activeAccountId: null,
                appVersion: '1.2.0',
                changelogSeen: false,
                loaded: true,
                reload: () => Promise.resolve(),
            }}
        >
            <WhatsNewDialog entry={ENTRY} onClose={onClose}/>
        </SettingsContext>,
    )
    return onClose
}

describe('WhatsNewDialog', () => {
    test('shows the version, the date and every section', () => {
        renderDialog('en')

        expect(screen.getByRole('dialog', {name: "What's new"})).toBeInTheDocument()
        expect(screen.getByText(/Version 1\.2\.0/)).toHaveTextContent('Version 1.2.0 · September 25, 2026')
        expect(screen.getByRole('heading', {name: 'New'})).toBeInTheDocument()
        expect(screen.getByRole('heading', {name: 'Fixed'})).toBeInTheDocument()
        expect(screen.getByText('Tags for transactions')).toBeInTheDocument()
        expect(screen.getByText('Faster startup')).toBeInTheDocument()
    })

    test('shows the items in the current language', async () => {
        await i18n.changeLanguage('de')
        renderDialog('de')

        expect(screen.getByRole('dialog', {name: 'Neuigkeiten'})).toBeInTheDocument()
        expect(screen.getByRole('heading', {name: 'Neu'})).toBeInTheDocument()
        expect(screen.getByText('Tags für Transaktionen')).toBeInTheDocument()
    })

    test('closes from the close button', async () => {
        const onClose = renderDialog('en')

        await userEvent.click(screen.getByRole('button', {name: 'Close'}))

        expect(onClose).toHaveBeenCalledOnce()
    })
})
