import {render, screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, test, vi} from 'vitest'
import {ApiProvider} from '../../api/ApiProvider'
import type {TransactionsApi} from '../../api/TransactionsApi'
import type {Category} from '../../api/types'
import {MonthProvider} from '../../state/MonthProvider'
import {CategoriesPage} from './CategoriesPage'

function category(id: string, name: string): Category {
    return {
        id,
        name,
        color: '#7c6fd6',
        direction: 'EXPENSE',
        warningThreshold: null,
        monthToDateTotal: 0,
        monthToDateIn: 0,
        monthToDateOut: 0,
        monthToDateCount: 0,
    }
}

function stubApi(overrides: Partial<TransactionsApi>): TransactionsApi {
    return {
        listTransactions: () => Promise.resolve({transactions: [], filteredCount: 0}),
        createTransaction: () => Promise.reject(new Error('not implemented')),
        updateTransaction: () => Promise.reject(new Error('not implemented')),
        deleteTransaction: () => Promise.reject(new Error('not implemented')),
        listCategories: () => Promise.resolve([]),
        createCategory: () => Promise.reject(new Error('not implemented')),
        updateCategory: () => Promise.reject(new Error('not implemented')),
        listCategoryTransactions: () => Promise.resolve([]),
        deleteCategory: () => Promise.resolve(),
        listTags: () => Promise.resolve([]),
        getMonthSummary: () => Promise.reject(new Error('not implemented')),
        getDailySpend: () => Promise.resolve([]),
        getSettings: () => Promise.resolve({currency: 'CHF', locale: null}),
        updateSettings: () => Promise.reject(new Error('not implemented')),
        clearAllData: () => Promise.resolve(),
        getVersionInfo: () => Promise.resolve({current: null, latest: null, updateAvailable: false, releaseUrl: null}),
        ...overrides,
    }
}

describe('CategoriesPage delete', () => {
    test('a failing refresh after a successful delete is not reported as a failed delete', async () => {
        const user = userEvent.setup()
        const listCategories = vi
            .fn()
            .mockResolvedValueOnce([category('1', 'Food'), category('2', 'Fun')])
            .mockRejectedValue(new Error('boom'))
        const deleteCategory = vi.fn().mockResolvedValue(undefined)

        render(
            <ApiProvider api={stubApi({listCategories, deleteCategory})}>
                <MonthProvider>
                    <CategoriesPage/>
                </MonthProvider>
            </ApiProvider>,
        )

        await user.click(await screen.findByRole('button', {name: 'Fun'}))
        await user.click(screen.getByRole('button', {name: 'Delete'}))
        await screen.findByRole('dialog')
        await user.click(within(screen.getByRole('dialog')).getByRole('button', {name: 'Delete'}))

        await waitFor(() => expect(deleteCategory).toHaveBeenCalledWith('2', []))
        await waitFor(() => expect(screen.queryByRole('button', {name: 'Fun'})).not.toBeInTheDocument())
        expect(screen.queryByText(/could not delete/i)).not.toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Food'})).toBeInTheDocument()
    })
})

describe('CategoriesPage translations', () => {
    test('the delete confirmation shows a name containing markup as plain text', async () => {
        const user = userEvent.setup()
        render(
            <ApiProvider api={stubApi({listCategories: () => Promise.resolve([category('1', '<i>Food</i>')])})}>
                <MonthProvider>
                    <CategoriesPage/>
                </MonthProvider>
            </ApiProvider>,
        )

        await user.click(await screen.findByRole('button', {name: '<i>Food</i>'}))
        await user.click(screen.getByRole('button', {name: 'Delete'}))

        const dialog = await screen.findByRole('dialog')
        expect(within(dialog).getByText('<i>Food</i>').tagName).toBe('STRONG')
        expect(dialog.querySelector('i')).toBeNull()
        expect(dialog).toHaveTextContent('has no transactions and will be removed')
    })
})
