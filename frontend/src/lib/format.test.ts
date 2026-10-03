import {describe, expect, test} from 'vitest'
import i18n from '../i18n'
import {registerTestGerman} from '../i18n/testing'
import {
    formatDayHeading,
    formatMoney,
    formatMoneyWithCurrency,
    formatMonthLabel,
    formatMonthLabelShort,
    formatShortDate,
} from './format'

describe('formatMoney', () => {
    test('uses a straight apostrophe as the thousands separator', () => {
        expect(formatMoney(4186.35, {sign: false})).toBe("4'186.35")
    })

    test('prefixes a minus sign for negative amounts', () => {
        expect(formatMoney(-48.9)).toBe('-48.90')
    })

    test('prefixes a plus sign for positive amounts by default', () => {
        expect(formatMoney(1200)).toBe("+1'200.00")
    })

    test('omits the plus sign for positive amounts when sign is false', () => {
        expect(formatMoney(1200, {sign: false})).toBe("1'200.00")
    })

    test('never signs zero', () => {
        expect(formatMoney(0)).toBe('0.00')
    })
})

describe('formatMoneyWithCurrency', () => {
    test('formats with the given currency prefix and no sign by default', () => {
        expect(formatMoneyWithCurrency(4186.35, 'CHF')).toBe("CHF 4'186.35")
        expect(formatMoneyWithCurrency(4186.35, 'EUR')).toBe("EUR 4'186.35")
    })
})

describe('date formatting', () => {
    test('formatShortDate renders DD.MM', () => {
        expect(formatShortDate('2026-09-25')).toBe('25.09')
    })

    test('formatDayHeading renders the full uppercase day heading', () => {
        expect(formatDayHeading('2026-09-25')).toBe('FRIDAY 25 SEPTEMBER')
    })

    test('formatMonthLabel renders the full month name and year', () => {
        expect(formatMonthLabel(2026, 9)).toBe('September 2026')
    })

    test('formatMonthLabelShort renders the abbreviated month and year', () => {
        expect(formatMonthLabelShort(2026, 9)).toBe('Sep 2026')
    })
})

describe('date names follow the active language', () => {
    registerTestGerman()

    test('uses the German names and word order', async () => {
        await i18n.changeLanguage('de')
        expect(formatDayHeading('2026-09-25')).toBe('FREITAG, 25. SEPTEMBER')
        expect(formatMonthLabelShort(2026, 9)).toBe('Sept. 2026')
    })
})
