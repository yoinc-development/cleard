import {useEffect, useState} from 'react'
import {useApi} from '../../api/ApiContext'
import type {TransactionsApi} from '../../api/TransactionsApi'
import type {Category, DailySpend, MonthSummary} from '../../api/types'
import {Card} from '../../components/Card/Card'
import {MonthNav} from '../../components/MonthNav/MonthNav'
import {PageHeader} from '../../components/PageHeader/PageHeader'
import {formatMoneyWithCurrency} from '../../lib/format'
import {shiftMonth, useMonth} from '../../state/MonthContext'
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
    const api = useApi()
    const {selected} = useMonth()

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
                <Card className={styles.error}>Could not load the month summary.</Card>
            ) : (
                summary && (
                    <div className={styles.stats}>
                        <StatCard
                            label="Income"
                            tone="accent"
                            value={formatMoneyWithCurrency(summary.totalIn)}
                            subline={
                                <>
                                    {transactionsLabel(summary.countIn)}
                                    {prevSummary && <> · {vsPreviousMonth(summary.totalIn, prevSummary.totalIn, prevMonthName)}</>}
                                </>
                            }
                        />
                        <StatCard
                            label="Expenses"
                            value={formatMoneyWithCurrency(summary.totalOut)}
                            subline={
                                <>
                                    {transactionsLabel(summary.countOut)}
                                    {prevSummary && <> · {vsPreviousMonth(summary.totalOut, prevSummary.totalOut, prevMonthName)}</>}
                                </>
                            }
                        />
                        <StatCard
                            label="Net"
                            highlight
                            value={formatSignedCurrency(summary.net)}
                            subline={(() => {
                                const pct = keptPercent(summary.net, summary.totalIn)
                                return pct === null ? undefined : `${pct}% of income kept`
                            })()}
                        />
                    </div>
                )
            )}

            <div className={styles.grid}>
                {data?.dailySpendError ? (
                    <Card className={styles.error}>Could not load daily spend.</Card>
                ) : (
                    <DailySpendChart dailySpend={data?.dailySpend ?? []} selected={selected} average={average}/>
                )}

                {data?.categoriesError ? (
                    <Card className={styles.error}>Could not load categories.</Card>
                ) : (
                    <div className={styles.side}>
                        <CategoryPieCard title="Expenses by category" categories={expenseCategories}
                                         emptyText="No expenses this month"/>
                        <CategoryPieCard title="Income by category" categories={incomeCategories}
                                         emptyText="No income this month"/>
                    </div>
                )}
            </div>
        </div>
    )
}
