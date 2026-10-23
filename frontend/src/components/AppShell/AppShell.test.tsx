import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, describe, expect, test, vi} from 'vitest'
import {MemoryRouter} from 'react-router'
import {ApiProvider} from '../../api/ApiProvider'
import type {TransactionsApi} from '../../api/TransactionsApi'
import type {AppSettings} from '../../api/types'
import {CHANGELOG} from '../../features/whatsnew/changelog'
import {AccountProvider} from '../../state/AccountProvider'
import {SettingsProvider} from '../../state/SettingsProvider'
import {AppShell} from './AppShell'

const CURRENT = CHANGELOG[0].version

function stubApi(settings: Partial<AppSettings>) {
    const markChangelogSeen = vi.fn(() => Promise.resolve())
    const api = {
        listAccounts: () => Promise.resolve([]),
        getSettings: () => Promise.resolve({
            currency: 'CHF',
            locale: null,
            theme: 'dark',
            activeAccountId: null,
            appVersion: CURRENT,
            changelogSeen: false,
            ...settings,
        }),
        markChangelogSeen,
    } as unknown as TransactionsApi
    return {api, markChangelogSeen}
}

function renderShell(api: TransactionsApi) {
    render(
        <ApiProvider api={api}>
            <SettingsProvider>
                <AccountProvider>
                    <MemoryRouter>
                        <AppShell>
                            <p>page</p>
                        </AppShell>
                    </MemoryRouter>
                </AccountProvider>
            </SettingsProvider>
        </ApiProvider>,
    )
}

afterEach(() => {
    delete window.cleardShell
})

describe('AppShell release notes', () => {
    test('open on startup when the installed version was not seen yet', async () => {
        const {api, markChangelogSeen} = stubApi({})
        renderShell(api)

        expect(await screen.findByRole('dialog', {name: "What's new"})).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', {name: 'Got it'}))

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        await waitFor(() => expect(markChangelogSeen).toHaveBeenCalledOnce())
    })

    test('stay closed when the installed version was already seen', async () => {
        renderShell(stubApi({changelogSeen: true}).api)

        expect(await screen.findByText('page')).toBeInTheDocument()
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    test('stay closed in a development build', async () => {
        renderShell(stubApi({appVersion: null}).api)

        expect(await screen.findByText('page')).toBeInTheDocument()
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    test('open from the title bar and do not mark anything when already seen', async () => {
        window.cleardShell = {platform: 'win32', setTheme: vi.fn()}
        const {api, markChangelogSeen} = stubApi({changelogSeen: true})
        renderShell(api)

        await userEvent.click(await screen.findByRole('button', {name: "What's new"}))
        expect(screen.getByRole('dialog', {name: "What's new"})).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', {name: 'Close'}))

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(markChangelogSeen).not.toHaveBeenCalled()
    })
})
