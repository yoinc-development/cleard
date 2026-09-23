import type {SelectedMonth} from '../../state/MonthContext'
import {shiftMonth, toSelectedMonth} from '../../state/MonthContext'
import type {Category, DailySpend} from '../../api/types'
import {formatMoneyWithCurrency, formatMonthLabel} from '../../lib/format'

function currentMonthKey(today: Date): string {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

export function previousMonthName(monthKey: string): string {
    const prev = toSelectedMonth(shiftMonth(monthKey, -1))
    return formatMonthLabel(prev.year, prev.month).split(' ')[0]
}

export function daysInMonth(selected: SelectedMonth): number {
    return new Date(selected.year, selected.month, 0).getDate()
}

export function formatSignedCurrency(amount: number, currency = 'CHF'): string {
    const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
    return `${sign}${formatMoneyWithCurrency(Math.abs(amount), currency, {sign: false})}`
}

export function vsPreviousMonth(curr: number, prev: number, prevMonthName: string): string {
    const diff = curr - prev
    if (diff === 0) return `same as ${prevMonthName}`
    return `${formatSignedCurrency(diff)} vs ${prevMonthName}`
}

export function transactionsLabel(count: number): string {
    return `${count} transaction${count === 1 ? '' : 's'}`
}

export function keptPercent(net: number, totalIn: number): number | null {
    if (totalIn <= 0) return null
    return Math.round((net / totalIn) * 1000) / 10
}

export function averagePerDay(totalOut: number, selected: SelectedMonth, today: Date = new Date()): number | null {
    const currentKey = currentMonthKey(today)
    if (selected.key > currentKey) return null
    const elapsed = selected.key === currentKey ? today.getDate() : daysInMonth(selected)
    return totalOut / elapsed
}

export function fillDays(dailySpend: DailySpend[], selected: SelectedMonth): DailySpend[] {
    const byDate = new Map(dailySpend.map((d) => [d.date, d.totalOut]))
    const total = daysInMonth(selected)
    const monthPrefix = selected.key
    return Array.from({length: total}, (_, i) => {
        const date = `${monthPrefix}-${String(i + 1).padStart(2, '0')}`
        return {date, totalOut: byDate.get(date) ?? 0}
    })
}

export interface AxisTick {
    day: number
    label: string
}

export function axisTicks(selected: SelectedMonth, today: Date = new Date()): AxisTick[] {
    const total = daysInMonth(selected)
    const isCurrentMonth = selected.key === currentMonthKey(today)
    const days = new Set([1, 7, 14, 21, total])
    const ticks: AxisTick[] = []
    for (const day of days) {
        if (day < 1 || day > total) continue
        if (isCurrentMonth && day === today.getDate()) continue
        ticks.push({day, label: String(day)})
    }
    if (isCurrentMonth) {
        ticks.push({day: today.getDate(), label: `today · ${today.getDate()}`})
    }
    return ticks.sort((a, b) => a.day - b.day)
}

export function isFutureDay(isoDate: string, today: Date = new Date()): boolean {
    return isoDate > `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export function isToday(isoDate: string, today: Date = new Date()): boolean {
    return isoDate === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export interface CategoryShare {
    category: Category
    share: number | null
}

export function categoryShares(categories: Category[]): CategoryShare[] {
    const total = categories.reduce((sum, c) => sum + Math.max(c.monthToDateTotal, 0), 0)
    return [...categories]
        .sort((a, b) => b.monthToDateTotal - a.monthToDateTotal)
        .map((category) => ({
            category,
            share: total > 0 && category.monthToDateTotal > 0 ? Math.round((category.monthToDateTotal / total) * 100) : null,
        }))
}

export const OTHER_SLICE_ID = '__other__'

export interface PieSlice {
    id: string
    label: string
    value: number
    color: string
}

export interface PieData {
    slices: PieSlice[]
    sliceIdByCategory: Map<string, string>
}

export function buildPieSlices(categories: Category[], maxSlices = 5): PieData {
    const positive = [...categories]
        .filter((c) => c.monthToDateTotal > 0)
        .sort((a, b) => b.monthToDateTotal - a.monthToDateTotal)

    const top = positive.slice(0, maxSlices)
    const rest = positive.slice(maxSlices)

    const sliceIdByCategory = new Map<string, string>()
    const slices: PieSlice[] = top.map((c) => {
        sliceIdByCategory.set(c.id, c.id)
        return {id: c.id, label: c.name, value: c.monthToDateTotal, color: c.color}
    })

    if (rest.length > 0) {
        for (const c of rest) sliceIdByCategory.set(c.id, OTHER_SLICE_ID)
        const otherTotal = rest.reduce((sum, c) => sum + c.monthToDateTotal, 0)
        slices.push({id: OTHER_SLICE_ID, label: 'Other', value: otherTotal, color: 'color-text-dim'})
    }

    return {slices, sliceIdByCategory}
}

export function pieStartAngles(fractions: number[]): number[] {
    const angles: number[] = []
    let angle = -90
    for (const fraction of fractions) {
        angles.push(angle)
        angle += fraction * 360
    }
    return angles
}
