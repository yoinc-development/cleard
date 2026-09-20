import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import type { Category } from '../../api/types'
import { NewTransactionDialog } from './NewTransactionDialog'

const categories: Category[] = [
  {
    id: 'groceries',
    name: 'Groceries',
    color: 'category-color-1',
    direction: 'EXPENSE',
    warningThreshold: 800,
    monthToDateTotal: 812.45,
    monthToDateCount: 24,
  },
  {
    id: 'salary',
    name: 'Salary',
    color: 'category-color-1',
    direction: 'INCOME',
    warningThreshold: null,
    monthToDateTotal: 0,
    monthToDateCount: 0,
  },
]

async function fillCommonFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Description'), 'Migros')
  await user.type(screen.getByLabelText(/amount/i), '48.90')
  await user.click(screen.getByRole('button', { name: /select a category/i }))
  await user.click(screen.getByRole('option', { name: /groceries/i }))
}

describe('NewTransactionDialog', () => {
  test('defaults to expense - saving without touching the sign toggle produces a negative amount', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <NewTransactionDialog
        categories={categories}
        defaultDate="2026-09-25"
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    )

    await fillCommonFields(user)
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ amount: -48.9, categoryId: 'groceries', description: 'Migros' }),
    )
  })

  test('toggling the sign to income produces a positive amount', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <NewTransactionDialog
        categories={categories}
        defaultDate="2026-09-25"
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByRole('button', { name: /income/i }))
    await fillCommonFields(user)
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 48.9 }))
  })

  test('"Keep open to add another" leaves the dialog mounted and resets the form after save', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <NewTransactionDialog
        categories={categories}
        defaultDate="2026-09-25"
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByLabelText(/keep open to add another/i))
    await fillCommonFields(user)
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: /new transaction/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toHaveValue('')
  })

  test('without "keep open", saving closes the dialog', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <NewTransactionDialog
        categories={categories}
        defaultDate="2026-09-25"
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    )

    await fillCommonFields(user)
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('Save is disabled until description, amount and category are filled', async () => {
    render(
      <NewTransactionDialog
        categories={categories}
        defaultDate="2026-09-25"
        onClose={() => {}}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })
})
