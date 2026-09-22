import type {SelectedMonth} from '../../state/MonthContext'

export function thresholdPercent(total: number, threshold: number): number {
    if (threshold <= 0) return total > 0 ? Infinity : 0
    return Math.round((Math.max(total, 0) / threshold) * 100)
}

export function monthProgressText(selected: SelectedMonth, today: Date = new Date()): string | null {
    const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const daysInMonth = new Date(selected.year, selected.month, 0).getDate()

    if (selected.key < currentKey) return 'Month complete'
    if (selected.key > currentKey) return null

    const day = today.getDate()
    const pct = Math.round((day / daysInMonth) * 100)
    return `Day ${day} of ${daysInMonth} · ${pct}% of the month gone`
}
