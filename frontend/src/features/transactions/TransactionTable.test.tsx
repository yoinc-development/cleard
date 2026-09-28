import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, test, vi} from 'vitest'
import type {Category, Transaction} from '../../api/types'
import {TransactionTable} from './TransactionTable'

const categories: Category[] = [
    {
        id: 'groceries',
        name: 'Groceries',
        color: 'category-color-1',
        direction: 'EXPENSE',
        warningThreshold: 800,
        monthToDateTotal: 0,
        monthToDateIn: 0,
        monthToDateOut: 0,
        monthToDateCount: 0,
    },
]

function tx(overrides: Partial<Transaction>): Transaction {
    return {
        id: '1',
        date: '2026-09-25',
        amount: -10,
        currency: 'CHF',
        description: 'Test',
        categoryId: 'groceries',
        tags: [],
        ...overrides,
    }
}

describe('TransactionTable', () => {
    test('groups rows by day and shows the day net in the heading', () => {
        const transactions = [
            tx({id: '1', date: '2026-09-25', amount: -10}),
            tx({id: '2', date: '2026-09-25', amount: -5}),
            tx({id: '3', date: '2026-09-24', amount: 20}),
        ]

        render(
            <TransactionTable
                transactions={transactions}
                categories={categories}
                offset={0}
                pageSize={15}
                total={transactions.length}
                onPrevious={() => {
                }}
                onNext={() => {
                }}
                loading={false}
                onEdit={() => {
                }}
                onDelete={() => {
                }}
            />,
        )

        expect(screen.getByText('FRIDAY 25 SEPTEMBER · -15.00')).toBeInTheDocument()
        expect(screen.getByText('THURSDAY 24 SEPTEMBER · +20.00')).toBeInTheDocument()
    })

    test('shows an empty state when there are no transactions', () => {
        render(
            <TransactionTable
                transactions={[]}
                categories={categories}
                offset={0}
                pageSize={15}
                total={0}
                onPrevious={() => {
                }}
                onNext={() => {
                }}
                loading={false}
                onEdit={() => {
                }}
                onDelete={() => {
                }}
            />,
        )
        expect(screen.getByText(/no transactions match/i)).toBeInTheDocument()
    })

    describe('pagination', () => {
        test('shows the current range and total, and hides when everything fits on one page', () => {
            const {rerender} = render(
                <TransactionTable
                    transactions={[tx({})]}
                    categories={categories}
                    offset={15}
                    pageSize={15}
                    total={52}
                    onPrevious={() => {
                    }}
                    onNext={() => {
                    }}
                    loading={false}
                    onEdit={() => {
                    }}
                    onDelete={() => {
                    }}
                />,
            )

            expect(screen.getByText('16–30 of 52')).toBeInTheDocument()

            rerender(
                <TransactionTable
                    transactions={[tx({})]}
                    categories={categories}
                    offset={0}
                    pageSize={15}
                    total={10}
                    onPrevious={() => {
                    }}
                    onNext={() => {
                    }}
                    loading={false}
                    onEdit={() => {
                    }}
                    onDelete={() => {
                    }}
                />,
            )

            expect(screen.queryByText(/of 10/)).not.toBeInTheDocument()
        })

        test('the previous arrow is disabled on the first page and calls onPrevious otherwise', async () => {
            const user = userEvent.setup()
            const onPrevious = vi.fn()
            render(
                <TransactionTable
                    transactions={[tx({})]}
                    categories={categories}
                    offset={15}
                    pageSize={15}
                    total={52}
                    onPrevious={onPrevious}
                    onNext={() => {
                    }}
                    loading={false}
                    onEdit={() => {
                    }}
                    onDelete={() => {
                    }}
                />,
            )

            const previous = screen.getByRole('button', {name: 'Previous page'})
            expect(previous).not.toBeDisabled()
            await user.click(previous)
            expect(onPrevious).toHaveBeenCalledTimes(1)
        })

        test('the next arrow calls onNext when there are more pages', async () => {
            const user = userEvent.setup()
            const onNext = vi.fn()
            render(
                <TransactionTable
                    transactions={[tx({})]}
                    categories={categories}
                    offset={0}
                    pageSize={15}
                    total={35}
                    onPrevious={() => {
                    }}
                    onNext={onNext}
                    loading={false}
                    onEdit={() => {
                    }}
                    onDelete={() => {
                    }}
                />,
            )

            await user.click(screen.getByRole('button', {name: 'Next page'}))
            expect(onNext).toHaveBeenCalledTimes(1)
        })

        test('the next arrow is disabled on the last page', () => {
            render(
                <TransactionTable
                    transactions={[tx({})]}
                    categories={categories}
                    offset={30}
                    pageSize={15}
                    total={35}
                    onPrevious={() => {
                    }}
                    onNext={() => {
                    }}
                    loading={false}
                    onEdit={() => {
                    }}
                    onDelete={() => {
                    }}
                />,
            )

            expect(screen.getByRole('button', {name: 'Next page'})).toBeDisabled()
        })
    })

    test('right-clicking a row opens the app context menu with the two row actions', async () => {
        const user = userEvent.setup()
        render(
            <TransactionTable
                transactions={[tx({description: 'Coop'})]}
                categories={categories}
                offset={0}
                pageSize={15}
                total={0}
                onPrevious={() => {
                }}
                onNext={() => {
                }}
                loading={false}
                onEdit={() => {
                }}
                onDelete={() => {
                }}
            />,
        )

        await user.pointer({keys: '[MouseRight]', target: screen.getByText('Coop')})

        const items = screen.getAllByRole('menuitem').map((item) => item.textContent)
        expect(items).toEqual(['Edit Transaction…', 'Delete Transaction'])
    })

    test('"Edit Transaction…" hands the whole transaction back and closes the menu', async () => {
        const user = userEvent.setup()
        const onEdit = vi.fn()
        const transaction = tx({description: 'Coop'})
        render(
            <TransactionTable
                transactions={[transaction]}
                categories={categories}
                offset={0}
                pageSize={15}
                total={0}
                onPrevious={() => {
                }}
                onNext={() => {
                }}
                loading={false}
                onEdit={onEdit}
                onDelete={() => {
                }}
            />,
        )

        await user.pointer({keys: '[MouseRight]', target: screen.getByText('Coop')})
        await user.click(screen.getByRole('menuitem', {name: 'Edit Transaction…'}))

        expect(onEdit).toHaveBeenCalledWith(transaction)
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    test('"Delete Transaction" hands the whole transaction back', async () => {
        const user = userEvent.setup()
        const onDelete = vi.fn()
        const transaction = tx({description: 'Coop'})
        render(
            <TransactionTable
                transactions={[transaction]}
                categories={categories}
                offset={0}
                pageSize={15}
                total={0}
                onPrevious={() => {
                }}
                onNext={() => {
                }}
                loading={false}
                onEdit={() => {
                }}
                onDelete={onDelete}
            />,
        )

        await user.pointer({keys: '[MouseRight]', target: screen.getByText('Coop')})
        await user.click(screen.getByRole('menuitem', {name: 'Delete Transaction'}))

        expect(onDelete).toHaveBeenCalledWith(transaction)
    })

    test('the context menu closes on Escape', async () => {
        const user = userEvent.setup()
        render(
            <TransactionTable
                transactions={[tx({description: 'Coop'})]}
                categories={categories}
                offset={0}
                pageSize={15}
                total={0}
                onPrevious={() => {
                }}
                onNext={() => {
                }}
                loading={false}
                onEdit={() => {
                }}
                onDelete={() => {
                }}
            />,
        )

        await user.pointer({keys: '[MouseRight]', target: screen.getByText('Coop')})
        expect(screen.getByRole('menu')).toBeInTheDocument()

        await user.keyboard('{Escape}')
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
})
