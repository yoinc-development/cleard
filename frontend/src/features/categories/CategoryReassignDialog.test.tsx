import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, test, vi} from 'vitest'
import type {Category, Transaction} from '../../api/types'
import {CategoryReassignDialog} from './CategoryReassignDialog'

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

function transaction(id: string, description: string): Transaction {
    return {id, date: '2026-09-10', amount: -10, currency: 'CHF', description, categoryId: 'doomed', tags: []}
}

const doomed = category('doomed', 'Doomed')
const categories = [doomed, category('food', 'Food'), category('fun', 'Fun')]
const transactions = [transaction('1', 'Lunch'), transaction('2', 'Cinema')]

function renderDialog(onConfirm = vi.fn().mockResolvedValue(undefined), cats = categories) {
    render(
        <CategoryReassignDialog
            category={doomed}
            transactions={transactions}
            categories={cats}
            onCancel={() => {
            }}
            onConfirm={onConfirm}
        />,
    )
    return onConfirm
}

async function choose(user: ReturnType<typeof userEvent.setup>, rowIndex: number, name: string) {
    await user.click(screen.getAllByRole('button', {name: /choose category/i})[rowIndex])
    await user.click(screen.getByRole('option', {name}))
}

describe('CategoryReassignDialog', () => {
    test('lists every transaction and excludes the deleted category from the options', async () => {
        const user = userEvent.setup()
        renderDialog()

        expect(screen.getByText('Lunch')).toBeInTheDocument()
        expect(screen.getByText('Cinema')).toBeInTheDocument()

        await user.click(screen.getAllByRole('button', {name: /choose category/i})[0])
        const listbox = screen.getByRole('listbox')
        expect(within(listbox).getByRole('option', {name: 'Food'})).toBeInTheDocument()
        expect(within(listbox).queryByRole('option', {name: 'Doomed'})).not.toBeInTheDocument()
    })

    test('the action stays disabled until every row has a category', async () => {
        const user = userEvent.setup()
        renderDialog()
        const action = screen.getByRole('button', {name: /reassign & delete/i})

        expect(action).toBeDisabled()
        await choose(user, 0, 'Food')
        expect(action).toBeDisabled()
        await choose(user, 0, 'Fun')
        expect(action).toBeEnabled()
    })

    test('confirming emits one reassignment per transaction', async () => {
        const user = userEvent.setup()
        const onConfirm = renderDialog()

        await choose(user, 0, 'Food')
        await choose(user, 0, 'Fun')
        await user.click(screen.getByRole('button', {name: /reassign & delete/i}))

        expect(onConfirm).toHaveBeenCalledWith([
            {transactionId: '1', categoryId: 'food'},
            {transactionId: '2', categoryId: 'fun'},
        ])
    })

    test('a rejected confirm shows an inline error', async () => {
        const user = userEvent.setup()
        renderDialog(vi.fn().mockRejectedValue(new Error('409')))

        await choose(user, 0, 'Food')
        await choose(user, 0, 'Food')
        await user.click(screen.getByRole('button', {name: /reassign & delete/i}))

        expect(await screen.findByText(/could not delete the category/i)).toBeInTheDocument()
    })

    test('with no other category the action is disabled and a hint is shown', () => {
        renderDialog(undefined, [doomed])

        expect(screen.getByText(/create another category first/i)).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /reassign & delete/i})).toBeDisabled()
    })
})
