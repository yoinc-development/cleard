import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import type { Category, Transaction } from '../../api/types'
import { TransactionTable } from './TransactionTable'

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
    runningBalance: 100,
    ...overrides,
  }
}

describe('TransactionTable', () => {
  test('groups rows by day and shows the day net in the heading', () => {
    const transactions = [
      tx({ id: '1', date: '2026-09-25', amount: -10 }),
      tx({ id: '2', date: '2026-09-25', amount: -5 }),
      tx({ id: '3', date: '2026-09-24', amount: 20 }),
    ]

    render(
      <TransactionTable
        transactions={transactions}
        categories={categories}
        remainingCount={0}
        onLoadMore={() => {}}
        loading={false}
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
        remainingCount={0}
        onLoadMore={() => {}}
        loading={false}
      />,
    )
    expect(screen.getByText(/no transactions match/i)).toBeInTheDocument()
  })

  test('the "N more" affordance calls onLoadMore when clicked', async () => {
    const user = userEvent.setup()
    const onLoadMore = vi.fn()
    render(
      <TransactionTable
        transactions={[tx({})]}
        categories={categories}
        remainingCount={52}
        onLoadMore={onLoadMore}
        loading={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: '52 more' }))
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })
})
