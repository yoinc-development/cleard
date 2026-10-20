import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, test} from 'vitest'
import {ApiProvider} from '../../api/ApiProvider'
import type {TransactionsApi} from '../../api/TransactionsApi'
import type {Account, Category, MonthSummary, Transaction} from '../../api/types'
import {AccountContext} from '../../state/AccountContext'
import {MonthProvider} from '../../state/MonthProvider'
import {SettingsProvider} from '../../state/SettingsProvider'
import {TransactionsPage} from './TransactionsPage'

function transaction(overrides: Partial<Transaction> = {}): Transaction {
    return {
        id: '1',
        date: '2026-09-25',
        amount: -10,
        currency: 'CHF',
        description: 'Kiosk',
        categoryId: '1',
        accountId: '1',
        pairedTransactionId: null,
        tags: [],
        ...overrides,
    }
}

function summary(count: number): MonthSummary {
    return {count, countIn: 0, countOut: count, totalIn: 0, totalOut: 10, net: -10}
}

function stubApi(overrides: Partial<TransactionsApi> = {}): TransactionsApi {
    return {
        listTransactions: () => Promise.resolve({transactions: [], filteredCount: 0}),
        createTransaction: () => Promise.reject(new Error('not implemented')),
        updateTransaction: () => Promise.reject(new Error('not implemented')),
        deleteTransaction: () => Promise.resolve(),
        listAccounts: () => Promise.resolve([]),
        createAccount: () => Promise.reject(new Error('not implemented')),
        listCategories: () => Promise.resolve([]),
        createCategory: () => Promise.reject(new Error('not implemented')),
        updateCategory: () => Promise.reject(new Error('not implemented')),
        listCategoryTransactions: () => Promise.resolve([]),
        deleteCategory: () => Promise.resolve(),
        listTags: () => Promise.resolve([]),
        getMonthSummary: () => Promise.resolve(summary(0)),
        getDailySpend: () => Promise.resolve([]),
        getSettings: () => Promise.resolve({currency: 'CHF', locale: null, theme: 'dark', activeAccountId: null}),
        updateSettings: () => Promise.reject(new Error('not implemented')),
        clearAllData: () => Promise.resolve(),
        getVersionInfo: () => Promise.reject(new Error('not implemented')),
        ...overrides,
    }
}

function renderPage(api: TransactionsApi) {
    return render(
        <ApiProvider api={api}>
            <SettingsProvider>
                <MonthProvider>
                    <TransactionsPage/>
                </MonthProvider>
            </SettingsProvider>
        </ApiProvider>,
    )
}

describe('TransactionsPage translations', () => {
    test('the month summary uses the singular for one transaction', async () => {
        renderPage(stubApi({getMonthSummary: () => Promise.resolve(summary(1))}))

        expect(await screen.findByText(/^1 transaction · CHF 10\.00 out, CHF 0\.00 in$/)).toBeInTheDocument()
    })

    test('the month summary uses the plural otherwise', async () => {
        renderPage(stubApi({getMonthSummary: () => Promise.resolve(summary(3))}))

        expect(await screen.findByText(/^3 transactions · /)).toBeInTheDocument()
    })

    test('the delete confirmation shows a description containing markup as plain text', async () => {
        const user = userEvent.setup()
        const tricky = transaction({description: '<b>Rent</b> & more'})
        renderPage(stubApi({
            listTransactions: () => Promise.resolve({transactions: [tricky], filteredCount: 1}),
        }))

        await user.pointer({keys: '[MouseRight]', target: await screen.findByText('<b>Rent</b> & more')})
        await user.click(await screen.findByRole('menuitem', {name: 'Delete Transaction'}))

        const dialog = await screen.findByRole('dialog')
        const description = within(dialog).getByText('<b>Rent</b> & more')
        expect(description.tagName).toBe('STRONG')
        expect(dialog.querySelector('b')).toBeNull()
        expect(dialog).toHaveTextContent('CHF -10.00 on 25.09 will be removed. This cannot be undone.')
    })
})

describe('TransactionsPage transfers', () => {
    const accounts: Account[] = [
        {id: '1', name: 'Default', icon: 'bank'},
        {id: '2', name: 'Savings', icon: 'savings'},
    ]
    const transferCategory: Category = {
        id: '1',
        name: 'To Savings',
        color: '#7c6fd6',
        direction: 'EXPENSE',
        warningThreshold: null,
        accountId: '1',
        targetAccountId: '2',
        counterpartId: '9',
        monthToDateTotal: 0,
        monthToDateIn: 0,
        monthToDateOut: 0,
        monthToDateCount: 0,
    }

    function renderWithAccounts(api: TransactionsApi) {
        return render(
            <AccountContext
                value={{
                    accounts,
                    activeAccount: accounts[0],
                    selectAccount: () => Promise.resolve(),
                    createAccount: () => Promise.resolve(),
                    reload: () => Promise.resolve(),
                }}
            >
                <ApiProvider api={api}>
                    <SettingsProvider>
                        <MonthProvider>
                            <TransactionsPage/>
                        </MonthProvider>
                    </SettingsProvider>
                </ApiProvider>
            </AccountContext>,
        )
    }

    test('a paired transaction is marked with the account it is linked to', async () => {
        const paired = transaction({id: '1', description: 'Monthly', pairedTransactionId: '2'})
        const plain = transaction({id: '2', description: 'Kiosk'})
        renderWithAccounts(stubApi({
            listTransactions: () => Promise.resolve({transactions: [paired, plain], filteredCount: 2}),
            listCategories: () => Promise.resolve([transferCategory]),
        }))

        expect(await screen.findAllByText('⇄ Savings')).toHaveLength(1)
    })

    test('the delete confirmation of a paired transaction mentions the linked one', async () => {
        const user = userEvent.setup()
        const paired = transaction({description: 'Monthly', pairedTransactionId: '2'})
        renderWithAccounts(stubApi({
            listTransactions: () => Promise.resolve({transactions: [paired], filteredCount: 1}),
            listCategories: () => Promise.resolve([transferCategory]),
        }))

        await user.pointer({keys: '[MouseRight]', target: await screen.findByText('Monthly')})
        await user.click(await screen.findByRole('menuitem', {name: 'Delete Transaction'}))

        const dialog = await screen.findByRole('dialog')
        expect(dialog).toHaveTextContent('together with its linked transaction on Savings')
    })
})
