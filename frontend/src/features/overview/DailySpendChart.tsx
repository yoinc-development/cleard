import {Card} from '../../components/Card/Card'
import {formatMoneyWithCurrency, formatShortDate} from '../../lib/format'
import type {SelectedMonth} from '../../state/MonthContext'
import type {DailySpend} from '../../api/types'
import {axisTicks, fillDays, isFutureDay, isToday} from './overviewMath'
import styles from './DailySpendChart.module.css'

export interface DailySpendChartProps {
    dailySpend: DailySpend[]
    selected: SelectedMonth
    average: number | null
}

export function DailySpendChart({dailySpend, selected, average}: DailySpendChartProps) {
    const days = fillDays(dailySpend, selected)
    const max = Math.max(...days.map((d) => d.totalOut), 0)
    const ticks = axisTicks(selected)
    const gridStyle = {gridTemplateColumns: `repeat(${days.length}, 1fr)`}

    return (
        <Card className={styles.card}>
            <div className={styles.header}>
                <span className={styles.title}>Daily spend</span>
                {average !== null && (
                    <span className={styles.average}>avg {formatMoneyWithCurrency(average)} / day</span>
                )}
            </div>

            <div className={styles.bars} style={gridStyle}>
                {days.map((day, i) => {
                    const dayNumber = i + 1
                    const future = isFutureDay(day.date)
                    const today = isToday(day.date)
                    const height = future ? 100 : max > 0 ? Math.max((day.totalOut / max) * 100, day.totalOut > 0 ? 4 : 0) : 0
                    return (
                        <div
                            key={day.date}
                            className={styles.barTrack}
                            style={{gridColumnStart: dayNumber}}
                            title={future ? undefined : `${formatShortDate(day.date)}: ${formatMoneyWithCurrency(day.totalOut)}`}
                        >
                            <div
                                className={`${styles.bar} ${future ? styles.futureBar : ''} ${today ? styles.todayBar : ''}`}
                                style={{height: `${height}%`}}
                            />
                        </div>
                    )
                })}
            </div>

            <div className={styles.axis} style={gridStyle}>
                {ticks.map((tick) => (
                    <span key={tick.day} className={styles.axisLabel} style={{gridColumnStart: tick.day}}>
            {tick.label}
          </span>
                ))}
            </div>
        </Card>
    )
}
