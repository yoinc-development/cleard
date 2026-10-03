import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useApi} from '../../api/ApiContext'
import type {Category} from '../../api/types'
import {Card} from '../../components/Card/Card'
import {MonthNav} from '../../components/MonthNav/MonthNav'
import {PageHeader} from '../../components/PageHeader/PageHeader'
import {useMonth} from '../../state/MonthContext'
import {ThresholdCard} from './ThresholdCard'
import {monthProgressText, thresholdPercent} from './thresholdProgress'
import styles from './ThresholdsPage.module.css'

function byPercentDesc(a: Category, b: Category): number {
    return thresholdPercent(b.monthToDateTotal, b.warningThreshold ?? 0) -
        thresholdPercent(a.monthToDateTotal, a.warningThreshold ?? 0)
}

export function ThresholdsPage() {
    const {t} = useTranslation()
    const api = useApi()
    const {selected} = useMonth()

    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [loadFailed, setLoadFailed] = useState(false)

    useEffect(() => {
        let ignore = false
        setLoading(true)
        setLoadFailed(false)
        api.listCategories(selected.key).then(
            (result) => {
                if (ignore) return
                setCategories(result)
                setLoading(false)
            },
            () => {
                if (ignore) return
                setCategories([])
                setLoading(false)
                setLoadFailed(true)
            },
        )
        return () => {
            ignore = true
        }
    }, [api, selected.key])

    const watched = categories
        .filter((c) => c.direction === 'EXPENSE' && c.warningThreshold != null)
        .sort(byPercentDesc)

    return (
        <div className={styles.page}>
            <PageHeader left={<MonthNav/>} meta={monthProgressText(selected)}/>

            {loadFailed ? (
                <Card className={styles.error}>{t('thresholds.load_error')}</Card>
            ) : watched.length === 0 ? (
                !loading && <Card className={styles.placeholder}>{t('thresholds.empty')}</Card>
            ) : (
                <div className={styles.grid}>
                    {watched.map((category) => (
                        <ThresholdCard key={category.id} category={category}/>
                    ))}
                </div>
            )}
        </div>
    )
}
