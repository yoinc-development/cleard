import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, test, vi} from 'vitest'
import type {Category, Transaction} from '../../api/types'
import {TransactionDialog} from './TransactionDialog'

const categories: Category[] = [
    {
        id: 'groceries',
        name: 'Groceries',
        color: 'category-color-1',
        direction: 'EXPENSE',
        warningThreshold: 800,
        monthToDateTotal: 812.45,
        monthToDateIn: 0,
        monthToDateOut: 812.45,
        monthToDateCount: 24,
    },
    {
        id: 'salary',
        name: 'Salary',
        color: 'category-color-1',
        direction: 'INCOME',
        warningThreshold: null,
        monthToDateTotal: 0,
        monthToDateIn: 0,
        monthToDateOut: 0,
        monthToDateCount: 0,
    },
]

function getCategoryTrigger(): HTMLElement {
    const trigger = screen
        .getAllByRole('button')
        .find((button) => button.getAttribute('aria-haspopup') === 'listbox')
    if (!trigger) throw new Error('category select trigger not found')
    return trigger
}

async function pickCategory(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
    await user.click(getCategoryTrigger())
    await user.click(screen.getByRole('option', {name}))
}

async function fillCommonFields(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText('Description'), 'Migros')
    await user.type(screen.getByLabelText(/amount/i), '48.90')
    await pickCategory(user, /groceries/i)
}

const existing: Transaction = {
    id: '7',
    date: '2026-09-18',
    amount: -48.9,
    currency: 'CHF',
    description: 'Migros',
    categoryId: 'groceries',
    tags: ['weekly'],
    runningBalance: 4186.35,
}

describe('TransactionDialog', () => {
    test('defaults to expense - saving without touching the sign toggle produces a negative amount', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        render(
            <TransactionDialog
                categories={categories}
                defaultDate="2026-09-25"
                onClose={() => {
                }}
                onSubmit={onSubmit}
            />,
        )

        await fillCommonFields(user)
        await user.click(screen.getByRole('button', {name: /save/i}))

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({amount: -48.9, categoryId: 'groceries', description: 'Migros'}),
        )
    })

    test('picking an income category flips the sign to positive', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        render(
            <TransactionDialog
                categories={categories}
                defaultDate="2026-09-25"
                onClose={() => {
                }}
                onSubmit={onSubmit}
            />,
        )

        await user.type(screen.getByLabelText('Description'), 'Salary')
        await user.type(screen.getByLabelText(/amount/i), '48.90')
        await pickCategory(user, /salary/i)
        await user.click(screen.getByRole('button', {name: /save/i}))

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({amount: 48.9, categoryId: 'salary'}),
        )
    })

    test('picking a category sets the sign toggle to its direction', async () => {
        const user = userEvent.setup()
        render(
            <TransactionDialog
                categories={categories}
                defaultDate="2026-09-25"
                onClose={() => {
                }}
                onSubmit={vi.fn()}
            />,
        )

        await pickCategory(user, /salary/i)
        expect(screen.getByRole('button', {name: 'Income'})).toHaveAttribute('aria-pressed', 'true')

        await pickCategory(user, /groceries/i)
        expect(screen.getByRole('button', {name: 'Expense'})).toHaveAttribute('aria-pressed', 'true')
    })

    test('the sign toggle can still be overridden after picking a category, for refunds', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        render(
            <TransactionDialog
                categories={categories}
                defaultDate="2026-09-25"
                onClose={() => {
                }}
                onSubmit={onSubmit}
            />,
        )

        await fillCommonFields(user)
        await user.click(screen.getByRole('button', {name: 'Income'}))
        await user.click(screen.getByRole('button', {name: /save/i}))

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({amount: 48.9, categoryId: 'groceries'}),
        )
    })

    test('"Keep open to add another" leaves the dialog mounted and resets the form after save', async () => {
        const user = userEvent.setup()
        const onClose = vi.fn()
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        render(
            <TransactionDialog
                categories={categories}
                defaultDate="2026-09-25"
                onClose={onClose}
                onSubmit={onSubmit}
            />,
        )

        await user.click(screen.getByLabelText(/keep open to add another/i))
        await fillCommonFields(user)
        await user.click(screen.getByRole('button', {name: 'Income'}))
        await user.click(screen.getByRole('button', {name: /save/i}))

        expect(onSubmit).toHaveBeenCalledTimes(1)
        expect(onClose).not.toHaveBeenCalled()
        expect(screen.getByRole('heading', {name: /new transaction/i})).toBeInTheDocument()
        expect(screen.getByLabelText('Description')).toHaveValue('')
        expect(screen.getByRole('button', {name: 'Income'})).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('button', {name: /groceries/i})).toBeInTheDocument()
    })

    test('without "keep open", saving closes the dialog', async () => {
        const user = userEvent.setup()
        const onClose = vi.fn()
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        render(
            <TransactionDialog
                categories={categories}
                defaultDate="2026-09-25"
                onClose={onClose}
                onSubmit={onSubmit}
            />,
        )

        await fillCommonFields(user)
        await user.click(screen.getByRole('button', {name: /save/i}))

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    test('Save is disabled until description, amount and category are filled', async () => {
        render(
            <TransactionDialog
                categories={categories}
                defaultDate="2026-09-25"
                onClose={() => {
                }}
                onSubmit={vi.fn()}
            />,
        )
        expect(screen.getByRole('button', {name: /save/i})).toBeDisabled()
    })
    test('in edit mode the form starts filled with the transaction', () => {
        render(
            <TransactionDialog
                categories={categories}
                defaultDate="2026-09-25"
                transaction={existing}
                onClose={() => {
                }}
                onSubmit={vi.fn()}
            />,
        )

        expect(screen.getByRole('heading', {name: /edit transaction/i})).toBeInTheDocument()
        expect(screen.getByLabelText('Date')).toHaveValue('2026-09-18')
        expect(screen.getByLabelText('Description')).toHaveValue('Migros')
        expect(screen.getByLabelText(/amount/i)).toHaveValue(48.9)
        expect(screen.getByRole('button', {name: 'Expense'})).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('button', {name: /groceries/i})).toBeInTheDocument()
        expect(screen.getByText('weekly')).toBeInTheDocument()
    })

    test('editing submits the changed fields and offers no "keep open"', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        render(
            <TransactionDialog
                categories={categories}
                defaultDate="2026-09-25"
                transaction={existing}
                onClose={() => {
                }}
                onSubmit={onSubmit}
            />,
        )

        expect(screen.queryByLabelText(/keep open to add another/i)).not.toBeInTheDocument()

        await user.clear(screen.getByLabelText('Description'))
        await user.type(screen.getByLabelText('Description'), 'Coop')
        await user.click(screen.getByRole('button', {name: /save/i}))

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                txDate: '2026-09-18',
                amount: -48.9,
                description: 'Coop',
                categoryId: 'groceries',
                tags: ['weekly'],
            }),
        )
    })

    test('an income transaction opens with the positive sign preselected', () => {
        render(
            <TransactionDialog
                categories={categories}
                defaultDate="2026-09-25"
                transaction={{...existing, amount: 5200, categoryId: 'salary', description: 'Salary'}}
                onClose={() => {
                }}
                onSubmit={vi.fn()}
            />,
        )
        expect(screen.getByRole('button', {name: 'Income'})).toHaveAttribute('aria-pressed', 'true')
    })
})
