import { formatMonthLabel, formatMonthLabelShort } from '../../lib/format'
import { useMonth } from '../../state/MonthContext'
import { Button } from '../Button/Button'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons/icons'
import styles from './MonthNav.module.css'

export interface MonthNavProps {
  variant?: 'large' | 'compact'
  showToday?: boolean
}

export function MonthNav({ variant = 'large', showToday = false }: MonthNavProps) {
  const { selected, goToPreviousMonth, goToNextMonth, goToCurrentMonth } = useMonth()
  const label =
    variant === 'large'
      ? formatMonthLabel(selected.year, selected.month)
      : formatMonthLabelShort(selected.year, selected.month)

  return (
    <div className={`${styles.nav} ${variant === 'compact' ? styles.compact : styles.large}`}>
      <button
        type="button"
        className={styles.arrow}
        onClick={goToPreviousMonth}
        aria-label="Previous month"
      >
        <ChevronLeftIcon width={16} height={16} />
      </button>
      <span className={styles.label}>{label}</span>
      <button type="button" className={styles.arrow} onClick={goToNextMonth} aria-label="Next month">
        <ChevronRightIcon width={16} height={16} />
      </button>
      {showToday && (
        <Button className={styles.today} onClick={goToCurrentMonth}>
          Today
        </Button>
      )}
    </div>
  )
}
