import {resolveCategoryColor} from '../../lib/color'
import {formatMoneyWithCurrency} from '../../lib/format'
import type {PieSlice} from './overviewMath'
import {pieStartAngles} from './overviewMath'
import styles from './DonutChart.module.css'

export interface DonutChartProps {
    slices: PieSlice[]
    centerLabel: string
    activeId: string | null
    onActiveChange: (id: string | null) => void
}

const SIZE = 160
const STROKE = 26
const CENTER = SIZE / 2
const RADIUS = CENTER - STROKE / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 2

export function DonutChart({slices, centerLabel, activeId, onActiveChange}: DonutChartProps) {
    const total = slices.reduce((sum, s) => sum + s.value, 0)
    const gap = slices.length > 1 ? GAP : 0

    const fractions = slices.map((s) => (total > 0 ? s.value / total : 0))
    const rotations = pieStartAngles(fractions)
    const arcs = slices.map((slice, i) => {
        const fraction = fractions[i]
        const arcLength = fraction * CIRCUMFERENCE
        const dash = Math.max(arcLength - gap, 0)
        return {slice, rotation: rotations[i], dash, percent: Math.round(fraction * 100)}
    })

    const summary = arcs.map(({slice, percent}) => `${slice.label} ${percent}%`).join(', ')

    return (
        <div className={styles.wrap}>
            <svg
                className={styles.svg}
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                role="img"
                aria-label={summary}
            >
                {arcs.map(({slice, rotation, dash, percent}) => (
                    <circle
                        key={slice.id}
                        className={styles.slice}
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                        fill="none"
                        stroke={resolveCategoryColor(slice.color)}
                        strokeWidth={STROKE}
                        strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                        transform={`rotate(${rotation} ${CENTER} ${CENTER})`}
                        style={{opacity: activeId === null || activeId === slice.id ? 1 : 0.35}}
                        onMouseEnter={() => onActiveChange(slice.id)}
                        onMouseLeave={() => onActiveChange(null)}
                    >
                        <title>{`${slice.label}: ${formatMoneyWithCurrency(slice.value)} (${percent}%)`}</title>
                    </circle>
                ))}
            </svg>
            <div className={styles.center}>
                <span className={styles.centerLabel}>{centerLabel}</span>
            </div>
        </div>
    )
}
