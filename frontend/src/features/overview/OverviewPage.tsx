import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useApi} from '../../api/ApiContext'
import type {TransactionsApi} from '../../api/TransactionsApi'
import type {Category, DailySpend, MonthSummary} from '../../api/types'
import {Card} from '../../components/Card/Card'
import {MonthNav} from '../../components/MonthNav/MonthNav'
import {PageHeader} from '../../components/PageHeader/PageHeader'
import {formatMoneyWithCurrency} from '../../lib/format'
import {shiftMonth, useMonth} from '../../state/MonthContext'
import {useSettings} from '../../state/SettingsContext'
import {CategoryPieCard} from './CategoryPieCard'
import {DailySpendChart} from './DailySpendChart'
import {StatCard} from './StatCard'
import {
    averagePerDay,
    formatSignedCurrency,
    keptPercent,
    previousMonthName,
    transactionsLabel,
    vsPreviousMonth,
} from './overviewMath'
import styles from './OverviewPage.module.css'

interface OverviewData {
    summary: MonthSummary | null
    prevSummary: MonthSummary | null
    categories: Category[]
    dailySpend: DailySpend[]
    summaryError: boolean
    categoriesError: boolean
    dailySpendError: boolean
}

async function fetchOverviewData(api: TransactionsApi, month: string): Promise<OverviewData> {
    const prevMonth = shiftMonth(month, -1)
    const [summaryResult, prevSummaryResult, categoriesResult, dailySpendResult] = await Promise.allSettled([
        api.getMonthSummary(month),
        api.getMonthSummary(prevMonth),
        api.listCategories(month),
        api.getDailySpend(month),
    ])
    return {
        summary: summaryResult.status === 'fulfilled' ? summaryResult.value : null,
        prevSummary: prevSummaryResult.status === 'fulfilled' ? prevSummaryResult.value : null,
        categories: categoriesResult.status === 'fulfilled' ? categoriesResult.value : [],
        dailySpend: dailySpendResult.status === 'fulfilled' ? dailySpendResult.value : [],
        summaryError: summaryResult.status === 'rejected',
        categoriesError: categoriesResult.status === 'rejected',
        dailySpendError: dailySpendResult.status === 'rejected',
    }
}

export function OverviewPage() {
    const {t} = useTranslation()
    const api = useApi()
    const {selected} = useMonth()
    const {currency} = useSettings()

    const [data, setData] = useState<OverviewData | null>(null)

    useEffect(() => {
        let ignore = false
        setData(null)
        fetchOverviewData(api, selected.key).then((result) => {
            if (ignore) return
            setData(result)
        })
        return () => {
            ignore = true
        }
    }, [api, selected.key])

    const prevMonthName = previousMonthName(selected.key)

    const summary = data?.summary ?? null
    const prevSummary = data?.prevSummary
    const average = summary ? averagePerDay(summary.totalOut, selected) : null

    const categories = data?.categories ?? []
    const expenseCategories = categories.filter((c) => c.direction === 'EXPENSE')
    const incomeCategories = categories.filter((c) => c.direction === 'INCOME')

    return (
        <div className={styles.page}>
            <PageHeader left={<MonthNav/>}/>

            {data?.summaryError ? (
                <Card className={styles.error}>{t('overview.error_summary')}</Card>
            ) : (
                summary && (
                    <div className={styles.stats}>
                        <StatCard
                            label={t('common.income')}
                            tone="accent"
                            value={formatMoneyWithCurrency(summary.totalIn, currency)}
                            subline={
                                <>
                                    {transactionsLabel(summary.countIn)}
                                    {prevSummary && <> · {vsPreviousMonth(summary.totalIn, prevSummary.totalIn, prevMonthName, currency)}</>}
                                </>
                            }
                        />
                        <StatCard
                            label={t('common.expenses')}
                            value={formatMoneyWithCurrency(summary.totalOut, currency)}
                            subline={
                                <>
                                    {transactionsLabel(summary.countOut)}
                                    {prevSummary && <> · {vsPreviousMonth(summary.totalOut, prevSummary.totalOut, prevMonthName, currency)}</>}
                                </>
                            }
                        />
                        <StatCard
                            label={t('overview.net')}
                            highlight
                            value={formatSignedCurrency(summary.net, currency)}
                            subline={(() => {
                                const pct = keptPercent(summary.net, summary.totalIn)
                                return pct === null ? undefined : t('overview.kept', {percent: pct})
                            })()}
                        />
                    </div>
                )
            )}

            <div className={styles.grid}>
                {data?.dailySpendError ? (
                    <Card className={styles.error}>{t('overview.error_daily_spend')}</Card>
                ) : (
                    <DailySpendChart dailySpend={data?.dailySpend ?? []} selected={selected} average={average}/>
                )}

                {data?.categoriesError ? (
                    <Card className={styles.error}>{t('categories.load_error')}</Card>
                ) : (
                    <div className={styles.side}>
                        <CategoryPieCard title={t('overview.expenses_by_category')} categories={expenseCategories}
                                         emptyText={t('overview.no_expenses')}/>
                        <CategoryPieCard title={t('overview.income_by_category')} categories={incomeCategories}
                                         emptyText={t('overview.no_income')}/>
                    </div>
                )}
            </div>
        </div>
    )
}
