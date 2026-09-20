import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import type { Category } from '../../api/types'
import { CategoryEditor } from './CategoryEditor'

const eatingOut: Category = {
  id: 'eating-out',
  name: 'Eating out',
  colour: '#7c6fd6',
  direction: 'EXPENSE',
  warningThreshold: 350,
  monthToDateTotal: 446.9,
  monthToDateCount: 14,
}

describe('CategoryEditor', () => {
  test('seeds fields from the given category', () => {
    render(<CategoryEditor category={eatingOut} onCancel={() => {}} onSubmit={vi.fn()} />)

    expect(screen.getByLabelText('Name')).toHaveValue('Eating out')
    expect(screen.getByLabelText(/warning threshold/i)).toHaveValue(350)
    expect(screen.getByRole('button', { name: 'Expense' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Editing · Eating out')).toBeInTheDocument()
  })

  test('Save is disabled when the name is blank', async () => {
    const user = userEvent.setup()
    render(<CategoryEditor category={eatingOut} onCancel={() => {}} onSubmit={vi.fn()} />)

    await user.clear(screen.getByLabelText('Name'))
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  test('saving emits the current form as a CategoryDraft, including a cleared threshold', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<CategoryEditor category={eatingOut} onCancel={() => {}} onSubmit={onSubmit} />)

    await user.clear(screen.getByLabelText(/warning threshold/i))
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Eating out',
      colour: '#7c6fd6',
      direction: 'EXPENSE',
      warningThreshold: null,
    })
  })

  test('toggling direction to Income is reflected in the submitted draft', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<CategoryEditor category={eatingOut} onCancel={() => {}} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Income' }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ direction: 'INCOME' }))
  })

  test('a rejected submit shows an inline error and does not call onCancel', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onSubmit = vi.fn().mockRejectedValue(new Error('404'))
    render(<CategoryEditor category={eatingOut} onCancel={onCancel} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText(/could not save the category/i)).toBeInTheDocument()
    expect(onCancel).not.toHaveBeenCalled()
  })

  test('create mode starts blank and labels itself "New category"', () => {
    render(<CategoryEditor category={null} onCancel={() => {}} onSubmit={vi.fn()} />)

    expect(screen.getByText('New category')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })
})
