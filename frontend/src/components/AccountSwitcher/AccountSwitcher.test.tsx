import {render, screen, waitFor, within} from '@testing-library/react'
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

function stubApi(overrides: Partial<TransactionsApi> = {}, initial: Account[] = ACCOUNTS) {
    let accounts = [...initial]
    let settings: AppSettings = {currency: 'CHF', locale: null, theme: 'dark', activeAccountId: accounts[0].id}
    const updateSettings = vi.fn(async (body: AppSettingsUpdate) => {
        settings = {...settings, ...body}
        return settings
    })
    const createAccount = vi.fn(async (body: AccountDraft): Promise<Account> => ({id: '3', ...body}))
    const updateAccount = vi.fn(async (id: string, body: AccountDraft): Promise<Account> => {
        accounts = accounts.map((a) => (a.id === id ? {id, ...body} : a))
        return {id, ...body}
    })
    const deleteAccount = vi.fn(async (id: string) => {
        accounts = accounts.filter((a) => a.id !== id)
        if (settings.activeAccountId === id) settings = {...settings, activeAccountId: accounts[0].id}
    })
    const api = {
        listAccounts: () => Promise.resolve(accounts),
        createAccount,
        updateAccount,
        deleteAccount,
        getSettings: () => Promise.resolve(settings),
        updateSettings,
        ...overrides,
    } as unknown as TransactionsApi
    return {api, updateSettings, createAccount, updateAccount, deleteAccount}
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

    test('the pencil opens the dialog pre-filled and saving updates the account', async () => {
        const user = userEvent.setup()
        const {api, updateAccount} = stubApi()
        renderSwitcher(api)

        await user.click(await screen.findByRole('button', {name: 'Switch account'}))
        await user.click(screen.getByRole('button', {name: 'Edit Revolut'}))

        expect(screen.getByRole('dialog', {name: 'Edit account'})).toBeInTheDocument()
        expect(screen.getByLabelText('Title')).toHaveValue('Revolut')
        expect(screen.getByRole('radio', {name: 'Card'})).toHaveAttribute('aria-checked', 'true')

        await user.clear(screen.getByLabelText('Title'))
        await user.type(screen.getByLabelText('Title'), ' Revolut Main ')
        await user.click(screen.getByRole('radio', {name: 'Wallet'}))
        await user.click(screen.getByRole('button', {name: 'Save'}))

        await waitFor(() => expect(updateAccount).toHaveBeenCalledWith('2', {name: 'Revolut Main', icon: 'wallet'}))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    test('renaming the active account updates the switcher', async () => {
        const user = userEvent.setup()
        renderSwitcher(stubApi().api)

        await user.click(await screen.findByRole('button', {name: 'Switch account'}))
        await user.click(screen.getByRole('button', {name: 'Edit Default'}))
        await user.clear(screen.getByLabelText('Title'))
        await user.type(screen.getByLabelText('Title'), 'UBS')
        await user.click(screen.getByRole('button', {name: 'Save'}))

        await waitFor(() => expect(screen.getByRole('button', {name: 'Switch account'})).toHaveTextContent('UBS'))
    })

    test('the icon tiles show no text but keep their accessible names', async () => {
        const user = userEvent.setup()
        renderSwitcher(stubApi().api)

        await user.click(await screen.findByRole('button', {name: 'Switch account'}))
        await user.click(screen.getByRole('button', {name: /Add account/}))

        for (const name of ['Bank', 'Card', 'Savings', 'Wallet']) {
            expect(screen.getByRole('radio', {name}).textContent).toBe('')
        }
    })

    test('deleting asks for confirmation, deletes and falls back to the remaining account', async () => {
        const user = userEvent.setup()
        const {api, deleteAccount} = stubApi()
        renderSwitcher(api)

        await user.click(await screen.findByRole('button', {name: 'Switch account'}))
        await user.click(screen.getByRole('button', {name: 'Edit Default'}))
        await user.click(screen.getByRole('button', {name: 'Delete'}))

        const confirm = screen.getByRole('dialog')
        expect(confirm).toHaveTextContent('Delete account?')
        expect(confirm).toHaveTextContent('Default and its categories will be removed')
        expect(deleteAccount).not.toHaveBeenCalled()

        await user.click(within(confirm).getByRole('button', {name: 'Delete'}))

        await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith('1'))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(screen.getByRole('button', {name: 'Switch account'})).toHaveTextContent('Revolut')
    })

    test('cancelling the confirmation goes back to the form without deleting', async () => {
        const user = userEvent.setup()
        const {api, deleteAccount} = stubApi()
        renderSwitcher(api)

        await user.click(await screen.findByRole('button', {name: 'Switch account'}))
        await user.click(screen.getByRole('button', {name: 'Edit Revolut'}))
        await user.click(screen.getByRole('button', {name: 'Delete'}))
        await user.click(within(screen.getByRole('dialog')).getByRole('button', {name: 'Cancel'}))

        expect(screen.getByRole('dialog', {name: 'Edit account'})).toBeInTheDocument()
        expect(deleteAccount).not.toHaveBeenCalled()
    })

    test('shows an error and keeps the account when deleting fails', async () => {
        const user = userEvent.setup()
        renderSwitcher(stubApi({deleteAccount: () => Promise.reject(new Error('409'))}).api)

        await user.click(await screen.findByRole('button', {name: 'Switch account'}))
        await user.click(screen.getByRole('button', {name: 'Edit Revolut'}))
        await user.click(screen.getByRole('button', {name: 'Delete'}))
        await user.click(within(screen.getByRole('dialog')).getByRole('button', {name: 'Delete'}))

        expect(await screen.findByText(/Could not delete the account/)).toBeInTheDocument()
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    test('the last account has no Delete button', async () => {
        const user = userEvent.setup()
        renderSwitcher(stubApi({}, [ACCOUNTS[0]]).api)

        await user.click(await screen.findByRole('button', {name: 'Switch account'}))
        await user.click(screen.getByRole('button', {name: 'Edit Default'}))

        expect(screen.getByRole('dialog', {name: 'Edit account'})).toBeInTheDocument()
        expect(screen.queryByRole('button', {name: 'Delete'})).not.toBeInTheDocument()
    })
})
