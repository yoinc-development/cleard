import {render, screen} from '@testing-library/react'
import {describe, expect, test} from 'vitest'
import {ApiProvider} from '../../api/ApiProvider'
import type {TransactionsApi} from '../../api/TransactionsApi'
import type {Category} from '../../api/types'
import {MonthProvider} from '../../state/MonthProvider'
import {ThresholdsPage} from './ThresholdsPage'

function category(overrides: Partial<Category>): Category {
    return {
        id: overrides.id ?? 'category',
        name: overrides.name ?? 'Category',
        color: '#7c6fd6',
        direction: 'EXPENSE',
        warningThreshold: 350,
        monthToDateTotal: 100,
        monthToDateIn: 0,
        monthToDateOut: 100,
        monthToDateCount: 1,
        ...overrides,
    }
}

function stubApi(categories: Category[]): TransactionsApi {
    return {
        listTransactions: () => Promise.resolve({transactions: [], filteredCount: 0, remainingCount: 0}),
        createTransaction: () => Promise.reject(new Error('not implemented')),
        updateTransaction: () => Promise.reject(new Error('not implemented')),
        deleteTransaction: () => Promise.reject(new Error('not implemented')),
        listCategories: () => Promise.resolve(categories),
        createCategory: () => Promise.reject(new Error('not implemented')),
        updateCategory: () => Promise.reject(new Error('not implemented')),
        listTags: () => Promise.resolve([]),
        getMonthSummary: () =>
            Promise.resolve({count: 0, countIn: 0, countOut: 0, totalIn: 0, totalOut: 0, net: 0}),
        getDailySpend: () => Promise.resolve([]),
    }
}

function renderPage(categories: Category[]) {
    return render(
        <ApiProvider api={stubApi(categories)}>
            <MonthProvider>
                <ThresholdsPage/>
            </MonthProvider>
        </ApiProvider>,
    )
}

describe('ThresholdsPage', () => {
    test('shows only expense categories that have a threshold set, sorted by percent used', async () => {
        renderPage([
            category({id: 'groceries', name: 'Groceries', monthToDateTotal: 400, warningThreshold: 800}), // 50%
            category({id: 'eating-out', name: 'Eating out', monthToDateTotal: 446.9, warningThreshold: 350}), // 128%
            category({id: 'rent', name: 'Rent', warningThreshold: null}),
            category({id: 'salary', name: 'Salary', direction: 'INCOME', warningThreshold: 5000}),
        ])

        const names = (await screen.findAllByRole('progressbar')).length
        expect(names).toBe(2)

        const cards = screen.getAllByText(/% of threshold/)
        expect(cards[0].textContent).toBe('128% of threshold')
        expect(cards[1].textContent).toBe('50% of threshold')

        expect(screen.queryByText('Rent')).not.toBeInTheDocument()
        expect(screen.queryByText('Salary')).not.toBeInTheDocument()
    })

    test('shows an empty state when nothing has a threshold', async () => {
        renderPage([category({id: 'rent', name: 'Rent', warningThreshold: null})])

        expect(await screen.findByText('No thresholds set. Add one from Categories.')).toBeInTheDocument()
    })
})
