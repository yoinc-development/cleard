import { Fragment } from 'react'
import { ContextMenu } from '../../components/ContextMenu/ContextMenu'
import type { ContextMenuItem } from '../../components/ContextMenu/ContextMenu'
import { useContextMenu } from '../../components/ContextMenu/useContextMenu'
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
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
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
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const groups = groupByDay(transactions)
  const menu = useContextMenu<Transaction>()

  function menuItems(transaction: Transaction): ContextMenuItem[] {
    return [
      { label: 'Edit Transaction…', onSelect: () => onEdit(transaction) },
      { label: 'Delete Transaction', onSelect: () => onDelete(transaction) },
    ]
  }

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
            <th className={styles.actionHeader}>Actions</th>
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
                  onContextMenu={menu.open}
                  onEdit={onEdit}
                  onDelete={onDelete}
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

      {menu.state && (
        <ContextMenu
          x={menu.state.x}
          y={menu.state.y}
          items={menuItems(menu.state.target)}
          onClose={menu.close}
          label={`Actions for ${menu.state.target.description}`}
        />
      )}
    </div>
  )
}
