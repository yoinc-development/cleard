import { CategoryDot } from '../../components/CategoryLabel/CategoryLabel'
import { formatMoney } from '../../lib/format'
import type { Category } from '../../api/types'
import styles from './CategoryTable.module.css'

export interface CategoryTableProps {
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function byMonthToDateDesc(a: Category, b: Category): number {
  return b.monthToDateTotal - a.monthToDateTotal
}

export function CategoryTable({ categories, selectedId, onSelect }: CategoryTableProps) {
  const expenses = categories.filter((c) => c.direction === 'EXPENSE').sort(byMonthToDateDesc)
  const income = categories.filter((c) => c.direction === 'INCOME').sort(byMonthToDateDesc)

  if (categories.length === 0) {
    return <p className={styles.empty}>No categories yet.</p>
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th className={styles.amountHeader}>This month</th>
            <th className={styles.amountHeader}>Count</th>
            <th className={styles.amountHeader}>Threshold</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length > 0 && (
            <CategoryGroup
              label={`Expense categories · ${expenses.length}`}
              categories={expenses}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          )}
          {income.length > 0 && (
            <CategoryGroup
              label={`Income categories · ${income.length}`}
              categories={income}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          )}
        </tbody>
      </table>
    </div>
  )
}

function CategoryGroup({
  label,
  categories,
  selectedId,
  onSelect,
}: {
  label: string
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <>
      <tr className={styles.groupHeader}>
        <th colSpan={4}>{label}</th>
      </tr>
      {categories.map((category) => {
        const isSelected = category.id === selectedId
        return (
          <tr key={category.id} className={isSelected ? styles.rowSelected : undefined}>
            <td>
              <button type="button" className={styles.nameButton} onClick={() => onSelect(category.id)}>
                <CategoryDot color={category.color} />
                {category.name}
              </button>
            </td>
            <td className={styles.amountCell}>{formatMoney(category.monthToDateTotal, { sign: false })}</td>
            <td className={styles.amountCell}>{category.monthToDateCount}</td>
            <td className={styles.amountCell}>
              {category.warningThreshold != null ? (
                formatMoney(category.warningThreshold, { sign: false })
              ) : (
                <span className={styles.emptyValue}>—</span>
              )}
            </td>
          </tr>
        )
      })}
    </>
  )
}
