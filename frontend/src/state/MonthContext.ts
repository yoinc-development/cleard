import { createContext, use } from 'react'

export interface SelectedMonth {
  key: string
  year: number
  month: number
}

export interface MonthContextValue {
  selected: SelectedMonth
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  goToCurrentMonth: () => void
}

export function toSelectedMonth(key: string): SelectedMonth {
  const [year, month] = key.split('-').map(Number)
  return { key, year, month }
}

export function shiftMonth(key: string, delta: number): string {
  const { year, month } = toSelectedMonth(key)
  const date = new Date(year, month - 1 + delta, 1)
  const nextYear = date.getFullYear()
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0')
  return `${nextYear}-${nextMonth}`
}

export const MonthContext = createContext<MonthContextValue | null>(null)

export function useMonth(): MonthContextValue {
  const ctx = use(MonthContext)
  if (!ctx) {
    throw new Error('useMonth() called outside a <MonthProvider>')
  }
  return ctx
}
