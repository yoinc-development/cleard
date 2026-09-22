import {render, screen} from '@testing-library/react'
import {describe, expect, test} from 'vitest'
import type {Category} from '../../api/types'
import {ThresholdCard} from './ThresholdCard'

function category(overrides: Partial<Category>): Category {
    return {
        id: 'eating-out',
        name: 'Eating out',
        color: '#7c6fd6',
        direction: 'EXPENSE',
        warningThreshold: 350,
        monthToDateTotal: 250,
        monthToDateIn: 0,
        monthToDateOut: 250,
        monthToDateCount: 14,
        ...overrides,
    }
}

describe('ThresholdCard', () => {
    test('shows the current amount, threshold and percent used', () => {
        render(<ThresholdCard category={category({monthToDateTotal: 175, warningThreshold: 350})}/>)

        expect(screen.getByText('175.00')).toBeInTheDocument()
        expect(screen.getByText('/ 350.00')).toBeInTheDocument()
        expect(screen.getByText('50% of threshold')).toBeInTheDocument()
    })

    test('uses the singular form for exactly one transaction', () => {
        render(<ThresholdCard category={category({monthToDateCount: 1})}/>)
        expect(screen.getByText('1 transaction')).toBeInTheDocument()
    })

    test('uses the plural form otherwise', () => {
        render(<ThresholdCard category={category({monthToDateCount: 14})}/>)
        expect(screen.getByText('14 transactions')).toBeInTheDocument()
    })

    test('caps the progress bar at 100% even when over threshold', () => {
        render(<ThresholdCard category={category({monthToDateTotal: 446.9, warningThreshold: 350})}/>)

        const bar = screen.getByRole('progressbar')
        expect(bar).toHaveAttribute('aria-valuenow', '100')
        expect(screen.getByText('128% of threshold')).toBeInTheDocument()
    })

    test('drops the category color once over threshold, so the danger style takes over', () => {
        const under = render(<ThresholdCard category={category({monthToDateTotal: 175, warningThreshold: 350})}/>)
        const fillUnder = under.getByRole('progressbar').firstElementChild as HTMLElement
        expect(fillUnder.style.background).not.toBe('')
        under.unmount()

        const over = render(<ThresholdCard category={category({monthToDateTotal: 446.9, warningThreshold: 350})}/>)
        const fillOver = over.getByRole('progressbar').firstElementChild as HTMLElement
        expect(fillOver.style.background).toBe('')
    })
})
