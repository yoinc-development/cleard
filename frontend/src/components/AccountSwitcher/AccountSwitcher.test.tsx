import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, test, vi} from 'vitest'
import {ApiProvider} from '../../api/ApiProvider'
import type {TransactionsApi} from '../../api/TransactionsApi'
import type {Account, AccountDraft, AppSettings, AppSettingsUpdate} from '../../api/types'
import {AccountProvider} from '../../state/AccountProvider'
import {SettingsProvider} from '../../state/SettingsProvider'
import {AccountSwitcher} from './AccountSwitcher'

const ACCOUNTS: Account[] = [
    {id: '1', name: 'Default', icon: 'bank'},
    {id: '2', name: 'Revolut', icon: 'card'},
]

function stubApi(overrides: Partial<TransactionsApi> = {}) {
    let settings: AppSettings = {currency: 'CHF', locale: null, theme: 'dark', activeAccountId: '1'}
    const updateSettings = vi.fn(async (body: AppSettingsUpdate) => {
        settings = {...settings, ...body}
        return settings
    })
    const createAccount = vi.fn(async (body: AccountDraft): Promise<Account> => ({id: '3', ...body}))
    const api = {
        listAccounts: () => Promise.resolve(ACCOUNTS),
        createAccount,
        getSettings: () => Promise.resolve(settings),
        updateSettings,
        ...overrides,
    } as unknown as TransactionsApi
    return {api, updateSettings, createAccount}
}

function renderSwitcher(api: TransactionsApi) {
    return render(
        <ApiProvider api={api}>
            <SettingsProvider>
                <AccountProvider>
                    <AccountSwitcher/>
                </AccountProvider>
            </SettingsProvider>
        </ApiProvider>,
    )
}

describe('AccountSwitcher', () => {
    test('shows the active account and lists all accounts when opened', async () => {
        const user = userEvent.setup()
        renderSwitcher(stubApi().api)

        const trigger = await screen.findByRole('button', {name: 'Switch account'})
        expect(trigger).toHaveTextContent('Default')

        await user.click(trigger)

        expect(screen.getByRole('option', {name: /Default/})).toHaveAttribute('aria-selected', 'true')
        expect(screen.getByRole('option', {name: /Revolut/})).toHaveAttribute('aria-selected', 'false')
        expect(screen.getByRole('button', {name: /Add account/})).toBeInTheDocument()
    })

    test('picking another account persists it as the active account', async () => {
        const user = userEvent.setup()
        const {api, updateSettings} = stubApi()
        renderSwitcher(api)

        await user.click(await screen.findByRole('button', {name: 'Switch account'}))
        await user.click(screen.getByRole('option', {name: /Revolut/}))

        expect(updateSettings).toHaveBeenCalledWith({activeAccountId: '2'})
        await waitFor(() => expect(screen.getByRole('button', {name: 'Switch account'})).toHaveTextContent('Revolut'))
    })

    test('closes on Escape without changing the account', async () => {
        const user = userEvent.setup()
        const {api, updateSettings} = stubApi()
        renderSwitcher(api)

        await user.click(await screen.findByRole('button', {name: 'Switch account'}))
        await user.keyboard('{Escape}')

        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
        expect(updateSettings).not.toHaveBeenCalled()
    })

    test('creates an account from the dialog and switches to it', async () => {
        const user = userEvent.setup()
        const {api, createAccount, updateSettings} = stubApi()
        renderSwitcher(api)

        await user.click(await screen.findByRole('button', {name: 'Switch account'}))
        await user.click(screen.getByRole('button', {name: /Add account/}))

        const submit = screen.getByRole('button', {name: /Create account/})
        expect(submit).toBeDisabled()

        await user.type(screen.getByLabelText('Title'), '  ZKB Sparkonto ')
        await user.click(screen.getByRole('radio', {name: 'Savings'}))
        await user.click(submit)

        await waitFor(() => expect(createAccount).toHaveBeenCalledWith({name: 'ZKB Sparkonto', icon: 'savings'}))
        expect(updateSettings).toHaveBeenCalledWith({activeAccountId: '3'})
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    test('keeps the dialog open and shows an error when creating fails', async () => {
        const user = userEvent.setup()
        const {api} = stubApi({createAccount: () => Promise.reject(new Error('boom'))})
        renderSwitcher(api)

        await user.click(await screen.findByRole('button', {name: 'Switch account'}))
        await user.click(screen.getByRole('button', {name: /Add account/}))
        await user.type(screen.getByLabelText('Title'), 'Cash')
        await user.click(screen.getByRole('button', {name: /Create account/}))

        expect(await screen.findByText(/Could not create the account/)).toBeInTheDocument()
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
})
