import {useState} from 'react'
import {Card} from '../../components/Card/Card'
import {CategoryDot} from '../../components/CategoryLabel/CategoryLabel'
import {formatMoney, formatMoneyWithCurrency} from '../../lib/format'
import type {Category} from '../../api/types'
import {DonutChart} from './DonutChart'
import {buildPieSlices, categoryShares} from './overviewMath'
import styles from './CategoryPieCard.module.css'

export interface CategoryPieCardProps {
    title: string
    categories: Category[]
    emptyText: string
}

export function CategoryPieCard({title, categories, emptyText}: CategoryPieCardProps) {
    const [activeId, setActiveId] = useState<string | null>(null)

    const shares = categoryShares(categories)
    const {slices, sliceIdByCategory} = buildPieSlices(categories)
    const total = slices.reduce((sum, s) => sum + s.value, 0)

    return (
        <Card className={styles.card}>
            <span className={styles.title}>{title}</span>

            {total <= 0 ? (
                <span className={styles.empty}>{emptyText}</span>
            ) : (
                <div className={styles.body}>
                    <DonutChart
                        slices={slices}
                        centerLabel={formatMoneyWithCurrency(total)}
                        activeId={activeId}
                        onActiveChange={setActiveId}
                    />

                    <ul className={styles.legend}>
                        {shares.map(({category, share}) => {
                            const sliceId = sliceIdByCategory.get(category.id) ?? null
                            return (
                                <li
                                    key={category.id}
                                    className={`${styles.row} ${sliceId !== null && sliceId === activeId ? styles.active : ''}`}
                                    onMouseEnter={() => sliceId && setActiveId(sliceId)}
                                    onMouseLeave={() => setActiveId(null)}
                                >
                                    <span className={styles.name}>
                                        <CategoryDot color={category.color}/>
                                        {category.name}
                                    </span>
                                    <span
                                        className={styles.amount}>{formatMoney(category.monthToDateTotal, {sign: false})}</span>
                                    <span className={styles.pct}>{share === null ? '—' : `${share}%`}</span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </Card>
    )
}
