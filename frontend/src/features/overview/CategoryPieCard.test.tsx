import {render, screen} from '@testing-library/react'
import {describe, expect, test} from 'vitest'
import type {Category} from '../../api/types'
import {CategoryPieCard} from './CategoryPieCard'

function category(overrides: Partial<Category>): Category {
    return {
        id: overrides.id ?? 'category',
        name: overrides.name ?? 'Category',
        color: '#7c6fd6',
        direction: 'EXPENSE',
        warningThreshold: null,
        monthToDateTotal: 100,
        monthToDateIn: 0,
        monthToDateOut: 100,
        monthToDateCount: 1,
        ...overrides,
    }
}

describe('CategoryPieCard', () => {
    test('shows the title and each category\'s share of the total in the legend', () => {
        render(
            <CategoryPieCard
                title="Expenses by category"
                emptyText="No expenses this month"
                categories={[
                    category({id: 'rent', name: 'Rent', monthToDateTotal: 1690}),
                    category({id: 'groceries', name: 'Groceries', monthToDateTotal: 812.45}),
                ]}
            />,
        )

        expect(screen.getByText('Expenses by category')).toBeInTheDocument()
        expect(screen.getByText('68%')).toBeInTheDocument()
        expect(screen.getByText('32%')).toBeInTheDocument()
    })

    test('merges categories past the top 5 into an Other slice, but keeps every category in the legend', () => {
        const categories = Array.from({length: 7}, (_, i) =>
            category({id: `cat-${i}`, name: `Cat ${i}`, monthToDateTotal: 100 - i}),
        )
        const {container} = render(
            <CategoryPieCard title="Expenses by category" emptyText="No expenses this month" categories={categories}/>,
        )

        // top 5 slices + 1 merged "Other" slice
        expect(container.querySelectorAll('circle')).toHaveLength(6)
        for (const c of categories) {
            expect(screen.getByText(c.name)).toBeInTheDocument()
        }
    })

    test('shows a dash instead of a percentage for a category with no positive total', () => {
        render(
            <CategoryPieCard
                title="Expenses by category"
                emptyText="No expenses this month"
                categories={[
                    category({id: 'rent', name: 'Rent', monthToDateTotal: 1690}),
                    category({id: 'refunded', name: 'Refunded', monthToDateTotal: -20}),
                ]}
            />,
        )

        expect(screen.getByText('Refunded').closest('li')).toHaveTextContent('—')
    })

    test('shows the empty text when there are no categories, or none with a positive total', () => {
        const {rerender} = render(
            <CategoryPieCard title="Income by category" emptyText="No income this month" categories={[]}/>,
        )
        expect(screen.getByText('No income this month')).toBeInTheDocument()

        rerender(
            <CategoryPieCard
                title="Income by category"
                emptyText="No income this month"
                categories={[category({id: 'x', name: 'Zero', direction: 'INCOME', monthToDateTotal: 0})]}
            />,
        )
        expect(screen.getByText('No income this month')).toBeInTheDocument()
    })
})
