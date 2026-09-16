import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { todayIso } from '../lib/format'
import { MonthContext, shiftMonth, toSelectedMonth } from './MonthContext'
import type { MonthContextValue } from './MonthContext'

export function MonthProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState(todayIso().slice(0, 7))

  const value = useMemo<MonthContextValue>(
    () => ({
      selected: toSelectedMonth(key),
      goToPreviousMonth: () => setKey((k) => shiftMonth(k, -1)),
      goToNextMonth: () => setKey((k) => shiftMonth(k, 1)),
      goToCurrentMonth: () => setKey(todayIso().slice(0, 7)),
    }),
    [key],
  )

  return <MonthContext value={value}>{children}</MonthContext>
}
