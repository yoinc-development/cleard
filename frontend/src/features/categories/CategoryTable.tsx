import {useTranslation} from 'react-i18next'
import {CategoryDot} from '../../components/CategoryLabel/CategoryLabel'
import {formatMoney} from '../../lib/format'
import type {Category} from '../../api/types'
import styles from './CategoryTable.module.css'

export interface CategoryTableProps {
    categories: Category[]
    selectedId: string | null
    onSelect: (id: string) => void
}

export function CategoryTable({categories, selectedId, onSelect}: CategoryTableProps) {
    const {t} = useTranslation()
    const expenses = categories.filter((c) => c.direction === 'EXPENSE')
    const income = categories.filter((c) => c.direction === 'INCOME')

    if (categories.length === 0) {
        return <p className={styles.empty}>{t('categories.table.empty')}</p>
    }

    return (
        <div className={styles.wrap}>
            <table className={styles.table}>
                <thead>
                <tr>
                    <th>{t('common.name')}</th>
                    <th className={styles.amountHeader}>{t('common.this_month')}</th>
                    <th className={styles.amountHeader}>{t('common.count')}</th>
                    <th className={styles.amountHeader}>{t('common.threshold')}</th>
                </tr>
                </thead>
                <tbody>
                {expenses.length > 0 && (
                    <CategoryGroup
                        label={t('categories.table.group_expense', {total: expenses.length})}
                        categories={expenses}
                        selectedId={selectedId}
                        onSelect={onSelect}
                    />
                )}
                {income.length > 0 && (
                    <CategoryGroup
                        label={t('categories.table.group_income', {total: income.length})}
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
    const {t} = useTranslation()
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
                                <CategoryDot color={category.color}/>
                                {category.name}
                            </button>
                        </td>
                        <td className={styles.amountCell}>
                            {formatMoney(category.monthToDateTotal, {sign: false})}
                            {category.monthToDateIn > 0 && category.monthToDateOut > 0 && (
                                <span className={styles.breakdown}>{t(
                                    category.direction === 'INCOME'
                                        ? 'categories.table.breakdown_income'
                                        : 'categories.table.breakdown_expense',
                                    {
                                        out: formatMoney(category.monthToDateOut, {sign: false}),
                                        in: formatMoney(category.monthToDateIn, {sign: false}),
                                    },
                                )}</span>
                            )}
                        </td>
                        <td className={styles.amountCell}>{category.monthToDateCount}</td>
                        <td className={styles.amountCell}>
                            {category.warningThreshold != null ? (
                                formatMoney(category.warningThreshold, {sign: false})
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
