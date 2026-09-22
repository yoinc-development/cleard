import {describe, expect, test} from 'vitest'
import {monthProgressText, thresholdPercent} from './thresholdProgress'

describe('thresholdPercent', () => {
    test('rounds the ratio of total to threshold to a whole percent', () => {
        expect(thresholdPercent(446.9, 350)).toBe(128)
    })

    test('can exceed 100 when over threshold', () => {
        expect(thresholdPercent(812.45, 800)).toBe(102)
    })

    test('clamps a negative net (refund-heavy month) to 0', () => {
        expect(thresholdPercent(-20, 350)).toBe(0)
    })

    test('treats a zero threshold with spend as over (Infinity), and with no spend as 0', () => {
        expect(thresholdPercent(10, 0)).toBe(Infinity)
        expect(thresholdPercent(0, 0)).toBe(0)
    })
})

describe('monthProgressText', () => {
    const today = new Date(2026, 8, 25) // 25 September 2026

    test('reports day progress for the current month', () => {
        expect(monthProgressText({key: '2026-09', year: 2026, month: 9}, today)).toBe(
            'Day 25 of 30 · 83% of the month gone',
        )
    })

    test('reports completion for a past month', () => {
        expect(monthProgressText({key: '2026-08', year: 2026, month: 8}, today)).toBe('Month complete')
    })

    test('reports nothing for a future month', () => {
        expect(monthProgressText({key: '2026-10', year: 2026, month: 10}, today)).toBeNull()
    })
})
