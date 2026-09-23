import {describe, expect, test} from 'vitest'
import type {SelectedMonth} from '../../state/MonthContext'
import type {Category} from '../../api/types'
import {
    averagePerDay,
    axisTicks,
    buildPieSlices,
    categoryShares,
    daysInMonth,
    fillDays,
    formatSignedCurrency,
    isFutureDay,
    isToday,
    keptPercent,
    OTHER_SLICE_ID,
    pieStartAngles,
    previousMonthName,
    transactionsLabel,
    vsPreviousMonth,
} from './overviewMath'

const sep2026: SelectedMonth = {key: '2026-09', year: 2026, month: 9}

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

describe('vsPreviousMonth', () => {
    test('formats a positive difference', () => {
        expect(vsPreviousMonth(4186.35, 3971.55, 'August')).toBe('+CHF 214.80 vs August')
    })

    test('formats a negative difference', () => {
        expect(vsPreviousMonth(3971.55, 4186.35, 'August')).toBe('-CHF 214.80 vs August')
    })

    test('reports no change explicitly', () => {
        expect(vsPreviousMonth(100, 100, 'August')).toBe('same as August')
    })
})

describe('formatSignedCurrency', () => {
    test('puts the sign before the currency code', () => {
        expect(formatSignedCurrency(3263.65)).toBe("+CHF 3'263.65")
        expect(formatSignedCurrency(-214.8)).toBe('-CHF 214.80')
        expect(formatSignedCurrency(0)).toBe('CHF 0.00')
    })
})

describe('transactionsLabel', () => {
    test('pluralizes on count', () => {
        expect(transactionsLabel(1)).toBe('1 transaction')
        expect(transactionsLabel(63)).toBe('63 transactions')
    })
})

describe('keptPercent', () => {
    test('computes percent of income kept as net, rounded to one decimal', () => {
        expect(keptPercent(3263.65, 7450)).toBe(43.8)
    })

    test('returns null when there was no income', () => {
        expect(keptPercent(0, 0)).toBeNull()
        expect(keptPercent(-50, 0)).toBeNull()
    })
})

describe('averagePerDay', () => {
    test('divides by days elapsed for the current month', () => {
        const today = new Date(2026, 8, 25)
        expect(averagePerDay(4186.35, sep2026, today)).toBeCloseTo(4186.35 / 25)
    })

    test('divides by the full month for a past month', () => {
        const today = new Date(2026, 9, 5) // October
        expect(averagePerDay(4186.35, sep2026, today)).toBeCloseTo(4186.35 / 30)
    })

    test('returns null for a future month', () => {
        const today = new Date(2026, 7, 5) // August
        expect(averagePerDay(4186.35, sep2026, today)).toBeNull()
    })
})

describe('daysInMonth', () => {
    test('returns the day count for the selected month', () => {
        expect(daysInMonth(sep2026)).toBe(30)
        expect(daysInMonth({key: '2026-02', year: 2026, month: 2})).toBe(28)
    })
})

describe('fillDays', () => {
    test('pads missing days with zero, in date order', () => {
        const result = fillDays([{date: '2026-09-03', totalOut: 12.5}], sep2026)
        expect(result).toHaveLength(30)
        expect(result[0]).toEqual({date: '2026-09-01', totalOut: 0})
        expect(result[2]).toEqual({date: '2026-09-03', totalOut: 12.5})
        expect(result[29]).toEqual({date: '2026-09-30', totalOut: 0})
    })
})

describe('axisTicks', () => {
    test('includes fixed ticks plus today for the current month', () => {
        const today = new Date(2026, 8, 25)
        const ticks = axisTicks(sep2026, today)
        expect(ticks.map((t) => t.label)).toEqual(['1', '7', '14', '21', 'today · 25', '30'])
    })

    test('omits today for a past month', () => {
        const today = new Date(2026, 9, 5)
        const ticks = axisTicks(sep2026, today)
        expect(ticks.map((t) => t.label)).toEqual(['1', '7', '14', '21', '30'])
    })
})

describe('isFutureDay / isToday', () => {
    const today = new Date(2026, 8, 25)

    test('flags days after today as future', () => {
        expect(isFutureDay('2026-09-26', today)).toBe(true)
        expect(isFutureDay('2026-09-25', today)).toBe(false)
        expect(isFutureDay('2026-09-24', today)).toBe(false)
    })

    test('flags exactly today', () => {
        expect(isToday('2026-09-25', today)).toBe(true)
        expect(isToday('2026-09-24', today)).toBe(false)
    })
})

describe('previousMonthName', () => {
    test('returns the previous month name', () => {
        expect(previousMonthName('2026-09')).toBe('August')
    })

    test('wraps across a year boundary', () => {
        expect(previousMonthName('2026-01')).toBe('December')
    })
})

describe('categoryShares', () => {
    test('computes each category\'s share of the sum of positive totals, sorted by total descending', () => {
        const shares = categoryShares([
            category({id: 'groceries', name: 'Groceries', monthToDateTotal: 812.45}),
            category({id: 'rent', name: 'Rent', monthToDateTotal: 1690}),
        ])

        expect(shares.map((s) => s.category.id)).toEqual(['rent', 'groceries'])
        expect(shares.map((s) => s.share)).toEqual([68, 32])
    })

    test('gives a null share to a category with no positive total, without affecting the others', () => {
        const shares = categoryShares([
            category({id: 'rent', name: 'Rent', monthToDateTotal: 1690}),
            category({id: 'refunded', name: 'Refunded', monthToDateTotal: -20}),
            category({id: 'zero', name: 'Zero', monthToDateTotal: 0}),
        ])

        expect(shares.find((s) => s.category.id === 'refunded')?.share).toBeNull()
        expect(shares.find((s) => s.category.id === 'zero')?.share).toBeNull()
        expect(shares.find((s) => s.category.id === 'rent')?.share).toBe(100)
    })

    test('gives every category a null share when nothing has a positive total', () => {
        const shares = categoryShares([category({id: 'refunded', monthToDateTotal: -20})])
        expect(shares[0].share).toBeNull()
    })
})

describe('pieStartAngles', () => {
    test('starts the first slice at 12 o\'clock (-90deg) and proceeds clockwise', () => {
        expect(pieStartAngles([0.5, 0.25, 0.25])).toEqual([-90, 90, 180])
    })

    test('a single full slice starts and ends at 12 o\'clock', () => {
        expect(pieStartAngles([1])).toEqual([-90])
    })

    test('returns an empty array for no slices', () => {
        expect(pieStartAngles([])).toEqual([])
    })
})

describe('buildPieSlices', () => {
    test('gives each category with a positive total its own slice when there are 5 or fewer', () => {
        const {slices, sliceIdByCategory} = buildPieSlices([
            category({id: 'rent', monthToDateTotal: 1690}),
            category({id: 'groceries', monthToDateTotal: 812.45}),
        ])

        expect(slices.map((s) => s.id)).toEqual(['rent', 'groceries'])
        expect(sliceIdByCategory.get('rent')).toBe('rent')
        expect(sliceIdByCategory.get('groceries')).toBe('groceries')
    })

    test('merges categories past the top 5 into one Other slice', () => {
        const categories = Array.from({length: 7}, (_, i) => category({id: `cat-${i}`, monthToDateTotal: 100 - i}))
        const {slices, sliceIdByCategory} = buildPieSlices(categories)

        expect(slices).toHaveLength(6)
        expect(slices.at(-1)).toMatchObject({id: OTHER_SLICE_ID, label: 'Other', value: 95 + 94})
        expect(sliceIdByCategory.get('cat-5')).toBe(OTHER_SLICE_ID)
        expect(sliceIdByCategory.get('cat-6')).toBe(OTHER_SLICE_ID)
        expect(sliceIdByCategory.get('cat-0')).toBe('cat-0')
    })

    test('excludes categories with no positive total from every slice', () => {
        const {slices, sliceIdByCategory} = buildPieSlices([
            category({id: 'rent', monthToDateTotal: 1690}),
            category({id: 'refunded', monthToDateTotal: -20}),
        ])

        expect(slices.map((s) => s.id)).toEqual(['rent'])
        expect(sliceIdByCategory.has('refunded')).toBe(false)
    })
})
