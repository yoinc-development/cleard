import {CategoryDot} from '../../components/CategoryLabel/CategoryLabel'
import {resolveCategoryColor} from '../../lib/color'
import {formatMoney} from '../../lib/format'
import type {Category} from '../../api/types'
import {thresholdPercent} from './thresholdProgress'
import styles from './ThresholdCard.module.css'

export interface ThresholdCardProps {
    category: Category
}

export function ThresholdCard({category}: ThresholdCardProps) {
    const threshold = category.warningThreshold ?? 0
    const total = category.monthToDateTotal
    const pct = thresholdPercent(total, threshold)
    const over = pct > 100

    return (
        <div className={`${styles.card} ${over ? styles.over : ''}`}>
            <div className={styles.header}>
        <span className={styles.name}>
          <CategoryDot color={category.color}/>
            {category.name}
        </span>
                <span className={styles.amounts}>
          <span className={styles.current}>{formatMoney(total, {sign: false})}</span>
          <span className={styles.threshold}> / {formatMoney(threshold, {sign: false})}</span>
        </span>
            </div>

            <div
                className={styles.track}
                role="progressbar"
                aria-valuenow={Math.min(pct, 100)}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className={styles.fill}
                    style={{
                        width: `${Math.min(pct, 100)}%`,
                        ...(over ? {} : {background: resolveCategoryColor(category.color)}),
                    }}
                />
            </div>

            <div className={styles.footer}>
                <span className={styles.pct}>{pct}% of threshold</span>
                <span className={styles.count}>
          {category.monthToDateCount} {category.monthToDateCount === 1 ? 'transaction' : 'transactions'}
        </span>
            </div>
        </div>
    )
}
