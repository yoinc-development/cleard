import {Fragment, useEffect, useRef} from 'react'
import {useTranslation} from 'react-i18next'
import {ContextMenu} from '../../components/ContextMenu/ContextMenu'
import type {ContextMenuItem} from '../../components/ContextMenu/ContextMenu'
import {useContextMenu} from '../../components/ContextMenu/useContextMenu'
import {Pagination} from '../../components/Pagination/Pagination'
import {formatDayHeading, formatMoney} from '../../lib/format'
import type {Category, Transaction} from '../../api/types'
import {TransactionRow} from './TransactionRow'
import styles from './TransactionTable.module.css'

export interface TransactionTableProps {
    transactions: Transaction[]
    categories: Category[]
    offset: number
    pageSize: number
    total: number
    onPrevious: () => void
    onNext: () => void
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
            groups.push({date: t.date, net: t.amount, transactions: [t]})
        }
    }
    return groups
}

export function TransactionTable({
                                     transactions,
                                     categories,
                                     offset,
                                     pageSize,
                                     total,
                                     onPrevious,
                                     onNext,
                                     loading,
                                     onEdit,
                                     onDelete,
                                 }: TransactionTableProps) {
    const {t} = useTranslation()
    const categoryById = new Map(categories.map((c) => [c.id, c]))
    const groups = groupByDay(transactions)
    const menu = useContextMenu<Transaction>()
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0
    }, [offset])

    function menuItems(transaction: Transaction): ContextMenuItem[] {
        return [
            {label: t('transactions.table.menu_edit'), onSelect: () => onEdit(transaction)},
            {label: t('transactions.table.menu_delete'), onSelect: () => onDelete(transaction)},
        ]
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.scroll} ref={scrollRef}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th>{t('common.date')}</th>
                        <th>{t('common.description')}</th>
                        <th>{t('common.category')}</th>
                        <th>{t('common.tags')}</th>
                        <th className={styles.amountHeader}>{t('common.amount')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {groups.map((group) => (
                        <Fragment key={group.date}>
                            <tr className={styles.groupHeader}>
                                <th colSpan={5}>
                                    {formatDayHeading(group.date)} · {formatMoney(group.net)}
                                </th>
                            </tr>
                            {group.transactions.map((transaction) => (
                                <TransactionRow
                                    key={transaction.id}
                                    transaction={transaction}
                                    category={categoryById.get(transaction.categoryId ?? '')}
                                    onContextMenu={menu.open}
                                />
                            ))}
                        </Fragment>
                    ))}
                    </tbody>
                </table>

                {transactions.length === 0 && !loading && (
                    <p className={styles.empty}>{t('transactions.table.empty')}</p>
                )}
            </div>

            <Pagination
                offset={offset}
                pageSize={pageSize}
                total={total}
                onPrevious={onPrevious}
                onNext={onNext}
            />

            {menu.state && (
                <ContextMenu
                    x={menu.state.x}
                    y={menu.state.y}
                    items={menuItems(menu.state.target)}
                    onClose={menu.close}
                    label={t('transactions.table.menu_label', {description: menu.state.target.description})}
                />
            )}
        </div>
    )
}
