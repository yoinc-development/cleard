import { describe, expect, test } from 'vitest'
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
    expect(formatMoney(4186.35, { sign: false })).toBe("4'186.35")
  })

  test('prefixes a minus sign for negative amounts', () => {
    expect(formatMoney(-48.9)).toBe('-48.90')
  })

  test('prefixes a plus sign for positive amounts by default', () => {
    expect(formatMoney(1200)).toBe("+1'200.00")
  })

  test('omits the plus sign for positive amounts when sign is false', () => {
    expect(formatMoney(1200, { sign: false })).toBe("1'200.00")
  })

  test('never signs zero', () => {
    expect(formatMoney(0)).toBe('0.00')
  })
})

describe('formatMoneyWithCurrency', () => {
  test('formats with a CHF prefix and no sign by default', () => {
    expect(formatMoneyWithCurrency(4186.35)).toBe("CHF 4'186.35")
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
