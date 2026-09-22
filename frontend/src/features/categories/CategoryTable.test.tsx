import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, test, vi} from 'vitest'
import type {Category} from '../../api/types'
import {CategoryTable} from './CategoryTable'

function category(overrides: Partial<Category>): Category {
    return {
        id: '1',
        name: 'Groceries',
        color: '#ff8000',
        direction: 'EXPENSE',
        warningThreshold: 800,
        monthToDateTotal: 812.45,
        monthToDateIn: 0,
        monthToDateOut: 812.45,
        monthToDateCount: 24,
        ...overrides,
    }
}

describe('CategoryTable', () => {
    test('groups categories into expense/income sections with counts', () => {
        const categories = [
            category({id: 'groceries', name: 'Groceries', direction: 'EXPENSE'}),
            category({id: 'eating-out', name: 'Eating out', direction: 'EXPENSE', monthToDateTotal: 446.9}),
            category({id: 'salary', name: 'Salary', direction: 'INCOME', monthToDateTotal: 6250}),
        ]
        render(<CategoryTable categories={categories} selectedId={null} onSelect={() => {
        }}/>)

        expect(screen.getByText('Expense categories · 2')).toBeInTheDocument()
        expect(screen.getByText('Income categories · 1')).toBeInTheDocument()
    })

    test('sorts each group by month-to-date total, descending', () => {
        const categories = [
            category({id: 'small', name: 'Small', monthToDateTotal: 10}),
            category({id: 'big', name: 'Big', monthToDateTotal: 100}),
        ]
        render(<CategoryTable categories={categories} selectedId={null} onSelect={() => {
        }}/>)

        const names = screen.getAllByRole('button').map((button) => button.textContent)
        expect(names[0]).toContain('Big')
        expect(names[1]).toContain('Small')
    })

    test('renders a dash for a category with no threshold set', () => {
        render(
            <CategoryTable
                categories={[category({id: 'rent', name: 'Rent', warningThreshold: null})]}
                selectedId={null}
                onSelect={() => {
                }}
            />,
        )

        expect(screen.getByText('—')).toBeInTheDocument()
    })

    test('clicking a category name calls onSelect with its id', async () => {
        const user = userEvent.setup()
        const onSelect = vi.fn()
        render(
            <CategoryTable
                categories={[category({id: 'groceries', name: 'Groceries'})]}
                selectedId={null}
                onSelect={onSelect}
            />,
        )

        await user.click(screen.getByRole('button', {name: /groceries/i}))
        expect(onSelect).toHaveBeenCalledWith('groceries')
    })

    test('shows an empty state when there are no categories', () => {
        render(<CategoryTable categories={[]} selectedId={null} onSelect={() => {
        }}/>)
        expect(screen.getByText(/no categories yet/i)).toBeInTheDocument()
    })

    test('shows the in/out breakdown for a category with offsetting transactions', () => {
        render(
            <CategoryTable
                categories={[
                    category({id: 'groceries', monthToDateTotal: 20, monthToDateOut: 50, monthToDateIn: 30}),
                ]}
                selectedId={null}
                onSelect={() => {
                }}
            />,
        )

        expect(screen.getByText('20.00')).toBeInTheDocument()
        expect(screen.getByText('50.00 out · 30.00 in')).toBeInTheDocument()
    })

    test('hides the breakdown for a category with no opposing transactions', () => {
        render(
            <CategoryTable
                categories={[category({id: 'groceries', monthToDateOut: 812.45, monthToDateIn: 0})]}
                selectedId={null}
                onSelect={() => {
                }}
            />,
        )

        expect(screen.queryByText(/out ·/)).not.toBeInTheDocument()
    })

    test('puts the dominant direction first for an income category', () => {
        render(
            <CategoryTable
                categories={[
                    category({
                        id: 'salary',
                        name: 'Salary',
                        direction: 'INCOME',
                        monthToDateTotal: 6050,
                        monthToDateIn: 6250,
                        monthToDateOut: 200,
                    }),
                ]}
                selectedId={null}
                onSelect={() => {
                }}
            />,
        )

        expect(screen.getByText("6'250.00 in · 200.00 out")).toBeInTheDocument()
    })
})
