import type {ReactNode} from 'react'
import {Card} from '../../components/Card/Card'
import styles from './StatCard.module.css'

export interface StatCardProps {
    label: string
    value: ReactNode
    subline?: ReactNode
    highlight?: boolean
    tone?: 'accent'
}

export function StatCard({label, value, subline, highlight = false, tone}: StatCardProps) {
    const classes = [styles.card, highlight && styles.highlight, tone === 'accent' && styles.accent]
        .filter(Boolean)
        .join(' ')

    return (
        <Card className={classes}>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value}</span>
            {subline && <span className={styles.subline}>{subline}</span>}
        </Card>
    )
}
