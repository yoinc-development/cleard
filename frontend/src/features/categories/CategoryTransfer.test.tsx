import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {ReactNode} from 'react'
import {describe, expect, test, vi} from 'vitest'
import type {Account, Category} from '../../api/types'
import {AccountContext} from '../../state/AccountContext'
import type {AccountContextValue} from '../../state/AccountContext'
import {CategoryEditor} from './CategoryEditor'
import {CategoryTable} from './CategoryTable'

const DEFAULT: Account = {id: '1', name: 'Default', icon: 'bank'}
const SAVINGS: Account = {id: '2', name: 'Savings', icon: 'savings'}

function withAccounts(accounts: Account[], children: ReactNode) {
    const value: AccountContextValue = {
        accounts,
        activeAccount: accounts[0],
        selectAccount: () => Promise.resolve(),
        createAccount: () => Promise.resolve(),
        reload: () => Promise.resolve(),
    }
    return <AccountContext value={value}>{children}</AccountContext>
}

function category(overrides: Partial<Category> = {}): Category {
    return {
        id: 'c1',
        name: 'To Savings',
        color: '#7c6fd6',
        direction: 'EXPENSE',
        warningThreshold: null,
        accountId: '1',
        targetAccountId: null,
        counterpartId: null,
        monthToDateTotal: 0,
        monthToDateIn: 0,
        monthToDateOut: 0,
        monthToDateCount: 0,
        ...overrides,
    }
}

describe('CategoryEditor transfer target', () => {
    test('create mode offers the other accounts and submits the chosen target', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        render(withAccounts([DEFAULT, SAVINGS], <CategoryEditor category={null} onCancel={() => {
        }} onSubmit={onSubmit}/>))

        await user.type(screen.getByLabelText('Name'), 'To Savings')
        await user.click(screen.getByLabelText(/transfer to account/i))
        expect(screen.queryByRole('option', {name: 'Default'})).not.toBeInTheDocument()
        await user.click(screen.getByRole('option', {name: 'Savings'}))
        await user.click(screen.getByRole('button', {name: /save/i}))

        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({name: 'To Savings', targetAccountId: '2'}))
    })

    test('create mode submits no target by default', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        render(withAccounts([DEFAULT, SAVINGS], <CategoryEditor category={null} onCancel={() => {
        }} onSubmit={onSubmit}/>))

        await user.type(screen.getByLabelText('Name'), 'Rent')
        await user.click(screen.getByRole('button', {name: /save/i}))

        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({targetAccountId: null}))
    })

    test('is hidden when there is no other account', () => {
        render(withAccounts([DEFAULT], <CategoryEditor category={null} onCancel={() => {
        }} onSubmit={vi.fn()}/>))

        expect(screen.queryByLabelText(/transfer to account/i)).not.toBeInTheDocument()
    })

    test('edit mode shows the target read-only and keeps it in the draft', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        render(withAccounts([DEFAULT, SAVINGS], <CategoryEditor
            category={category({targetAccountId: '2', counterpartId: 'c2'})}
            onCancel={() => {
            }}
            onSubmit={onSubmit}
        />))

        expect(screen.getByText(/Transfers to Savings/)).toBeInTheDocument()
        expect(screen.queryByLabelText(/transfer to account/i)).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', {name: /save/i}))

        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({targetAccountId: '2'}))
    })
})

describe('CategoryTable transfer marker', () => {
    test('marks transfer categories with their target account', () => {
        render(withAccounts([DEFAULT, SAVINGS], <CategoryTable
            categories={[category({targetAccountId: '2'}), category({id: 'c3', name: 'Rent'})]}
            selectedId={null}
            onSelect={() => {
            }}
        />))

        expect(screen.getAllByText('→ Savings')).toHaveLength(1)
    })
})
