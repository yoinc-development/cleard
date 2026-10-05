import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, test} from 'vitest'
import {ApiProvider} from '../../api/ApiProvider'
import type {TransactionsApi} from '../../api/TransactionsApi'
import type {MonthSummary, Transaction} from '../../api/types'
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
        categoryId: null,
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
        listCategories: () => Promise.resolve([]),
        createCategory: () => Promise.reject(new Error('not implemented')),
        updateCategory: () => Promise.reject(new Error('not implemented')),
        listCategoryTransactions: () => Promise.resolve([]),
        deleteCategory: () => Promise.resolve(),
        listTags: () => Promise.resolve([]),
        getMonthSummary: () => Promise.resolve(summary(0)),
        getDailySpend: () => Promise.resolve([]),
        getSettings: () => Promise.resolve({currency: 'CHF', locale: null, theme: 'dark'}),
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
