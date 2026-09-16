import { Fragment } from 'react'
import { formatDayHeading, formatMoney } from '../../lib/format'
import type { Category, Transaction } from '../../api/types'
import { TransactionRow } from './TransactionRow'
import styles from './TransactionTable.module.css'

export interface TransactionTableProps {
  transactions: Transaction[]
  categories: Category[]
  remainingCount: number
  onLoadMore: () => void
  loading: boolean
}

interface DayGroup {
  date: string
  net: number
  transactions: Transaction[]
}

function groupByDay(transactions: Transaction[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const t of transactions) {
    const current = groups[groups.length - 1]
    if (current && current.date === t.date) {
      current.transactions.push(t)
      current.net += t.amount
    } else {
      groups.push({ date: t.date, net: t.amount, transactions: [t] })
    }
  }
  return groups
}

export function TransactionTable({
  transactions,
  categories,
  remainingCount,
  onLoadMore,
  loading,
}: TransactionTableProps) {
  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const groups = groupByDay(transactions)

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Tags</th>
            <th className={styles.amountHeader}>Amount</th>
            <th className={styles.amountHeader}>Running</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.date}>
              <tr className={styles.groupHeader}>
                <th colSpan={6}>
                  {formatDayHeading(group.date)} · {formatMoney(group.net)}
                </th>
              </tr>
              {group.transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  category={categoryById.get(transaction.categoryId ?? '')}
                />
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>

      {transactions.length === 0 && !loading && (
        <p className={styles.empty}>No transactions match the current filters.</p>
      )}

      {remainingCount > 0 && (
        <p className={styles.footer}>
          …{' '}
          <button type="button" className={styles.loadMore} onClick={onLoadMore}>
            {remainingCount} more
          </button>
        </p>
      )}
    </div>
  )
}
