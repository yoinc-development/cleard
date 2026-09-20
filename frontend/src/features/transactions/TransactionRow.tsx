import { CategoryLabel } from '../../components/CategoryLabel/CategoryLabel'
import { Money } from '../../components/Money/Money'
import { TagPill } from '../../components/TagPill/TagPill'
import { formatShortDate } from '../../lib/format'
import type { Category, Transaction } from '../../api/types'
import styles from './TransactionTable.module.css'

export function TransactionRow({ transaction, category }: { transaction: Transaction; category: Category | undefined }) {
  return (
    <tr className={styles.row}>
      <td className={styles.dateCell}>{formatShortDate(transaction.date)}</td>
      <td>{transaction.description}</td>
      <td>
        {category ? (
          <CategoryLabel name={category.name} color={category.color} />
        ) : (
          <span className={styles.emptyValue}>—</span>
        )}
      </td>
      <td>
        <div className={styles.tags}>
          {transaction.tags.map((tag) => (
            <TagPill key={tag} name={tag} />
          ))}
        </div>
      </td>
      <td className={styles.amountCell}>
        <Money amount={transaction.amount} />
      </td>
      <td className={styles.amountCell}>
        {transaction.runningBalance === null ? (
          <span className={styles.emptyValue}>—</span>
        ) : (
          <Money amount={transaction.runningBalance} sign={false} />
        )}
      </td>
    </tr>
  )
}
