import {render, screen} from '@testing-library/react'
import {describe, expect, test} from 'vitest'
import {ApiProvider} from '../../api/ApiProvider'
import type {TransactionsApi} from '../../api/TransactionsApi'
import type {Category, MonthSummary} from '../../api/types'
import {MonthProvider} from '../../state/MonthProvider'
import {OverviewPage} from './OverviewPage'

function stubApi(overrides: Partial<TransactionsApi> = {}): TransactionsApi {
    return {
        listTransactions: () => Promise.resolve({transactions: [], filteredCount: 0, remainingCount: 0}),
        createTransaction: () => Promise.reject(new Error('not implemented')),
        updateTransaction: () => Promise.reject(new Error('not implemented')),
        deleteTransaction: () => Promise.reject(new Error('not implemented')),
        listCategories: () => Promise.resolve([]),
        createCategory: () => Promise.reject(new Error('not implemented')),
        updateCategory: () => Promise.reject(new Error('not implemented')),
        listTags: () => Promise.resolve([]),
        getMonthSummary: () => Promise.resolve({count: 0, countIn: 0, countOut: 0, totalIn: 0, totalOut: 0, net: 0}),
        getDailySpend: () => Promise.resolve([]),
        ...overrides,
    }
}

function renderPage(overrides: Partial<TransactionsApi> = {}) {
    return render(
        <ApiProvider api={stubApi(overrides)}>
            <MonthProvider>
                <OverviewPage/>
            </MonthProvider>
        </ApiProvider>,
    )
}

const currentSummary: MonthSummary = {
    count: 63,
    countIn: 2,
    countOut: 63,
    totalIn: 7450,
    totalOut: 4186.35,
    net: 3263.65,
}

const previousSummary: MonthSummary = {
    count: 60,
    countIn: 2,
    countOut: 60,
    totalIn: 7450,
    totalOut: 3971.55,
    net: 3478.45,
}

describe('OverviewPage', () => {
    test('shows income, expenses and net for the month, compared to the previous month', async () => {
        let call = 0
        renderPage({
            getMonthSummary: () => Promise.resolve(call++ === 0 ? currentSummary : previousSummary),
        })

        expect(await screen.findByText("CHF 7'450.00")).toBeInTheDocument()
        expect(screen.getByText("CHF 4'186.35")).toBeInTheDocument()
        expect(screen.getByText("+CHF 3'263.65")).toBeInTheDocument()
        expect(screen.getByText(/2 transactions/)).toBeInTheDocument()
        expect(screen.getByText(/63 transactions/)).toBeInTheDocument()
        expect(screen.getByText(/\+CHF 214\.80 vs/)).toBeInTheDocument()
    })

    test('shows expenses and income by category as separate pie cards', async () => {
        const categories: Category[] = [
            {
                id: 'rent',
                name: 'Rent',
                color: '#8b7cf6',
                direction: 'EXPENSE',
                warningThreshold: null,
                monthToDateTotal: 1690,
                monthToDateIn: 0,
                monthToDateOut: 1690,
                monthToDateCount: 1,
            },
            {
                id: 'salary',
                name: 'Salary',
                color: '#8b7cf6',
                direction: 'INCOME',
                warningThreshold: null,
                monthToDateTotal: 7450,
                monthToDateIn: 7450,
                monthToDateOut: 0,
                monthToDateCount: 1,
            },
        ]
        renderPage({listCategories: () => Promise.resolve(categories)})

        expect(await screen.findByText('Expenses by category')).toBeInTheDocument()
        expect(screen.getByText('Income by category')).toBeInTheDocument()
        expect(screen.getByText('Rent')).toBeInTheDocument()
        expect(screen.getByText('Salary')).toBeInTheDocument()
    })

    test('shows an error card when the summary fails to load, without blocking the rest of the page', async () => {
        const categories: Category[] = [
            {
                id: 'rent',
                name: 'Rent',
                color: '#8b7cf6',
                direction: 'EXPENSE',
                warningThreshold: null,
                monthToDateTotal: 1690,
                monthToDateIn: 0,
                monthToDateOut: 1690,
                monthToDateCount: 1,
            },
        ]
        renderPage({
            getMonthSummary: () => Promise.reject(new Error('boom')),
            listCategories: () => Promise.resolve(categories),
        })

        expect(await screen.findByText('Could not load the month summary.')).toBeInTheDocument()
        expect(await screen.findByText('Rent')).toBeInTheDocument()
    })

    test('shows an error card when the daily spend fails to load', async () => {
        renderPage({
            getDailySpend: () => Promise.reject(new Error('boom')),
            listCategories: () => Promise.resolve([]),
        })

        expect(await screen.findByText('Could not load daily spend.')).toBeInTheDocument()
    })
})
