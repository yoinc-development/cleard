import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import type {Category, CategoryReassignment, Transaction} from '../../api/types'
import {Button} from '../../components/Button/Button'
import {Modal} from '../../components/Modal/Modal'
import {Pagination} from '../../components/Pagination/Pagination'
import {Select} from '../../components/Select/Select'
import {formatShortDate} from '../../lib/format'
import styles from './CategoryReassignDialog.module.css'

export interface CategoryReassignDialogProps {
    category: Category
    transactions: Transaction[]
    categories: Category[]
    onCancel: () => void
    onConfirm: (reassignments: CategoryReassignment[]) => Promise<void>
}

const TITLE_ID = 'category-reassign-dialog-title'
const PAGE_SIZE = 10

export function CategoryReassignDialog({
                                           category,
                                           transactions,
                                           categories,
                                           onCancel,
                                           onConfirm,
                                       }: CategoryReassignDialogProps) {
    const {t} = useTranslation()
    const [targets, setTargets] = useState<Record<string, string>>({})
    const [offset, setOffset] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const options = categories
        .filter((c) => c.id !== category.id)
        .map((c) => ({value: c.id, label: c.name, color: c.color}))

    const allChosen = transactions.every((tx) => targets[tx.id])
    const chosenCount = transactions.filter((tx) => targets[tx.id]).length
    const pageTransactions = transactions.slice(offset, offset + PAGE_SIZE)
    const canSubmit = allChosen && options.length > 0 && !submitting

    async function handleSubmit() {
        if (!canSubmit) return
        setSubmitting(true)
        setError(null)
        try {
            await onConfirm(
                transactions.map((tx) => ({transactionId: tx.id, categoryId: targets[tx.id]})),
            )
        } catch {
            setError(t('categories.reassign.error'))
            setSubmitting(false)
        }
    }

    return (
        <Modal onClose={onCancel} labelledBy={TITLE_ID}>
            <div className={styles.header}>
                <h2 className={styles.title} id={TITLE_ID}>
                    {t('categories.reassign.title', {name: category.name})}
                </h2>
                <span className={styles.hint}>{t('common.hint_cancel')}</span>
            </div>

            <p className={styles.intro}>
                {t('categories.reassign.intro', {count: transactions.length})}
            </p>

            {options.length === 0 && (
                <p className={styles.error}>{t('categories.reassign.no_targets')}</p>
            )}

            <ul className={styles.list}>
                {pageTransactions.map((tx) => (
                    <li key={tx.id} className={styles.row}>
                        <span className={styles.date}>{formatShortDate(tx.date)}</span>
                        <span className={styles.description}>{tx.description}</span>
                        <div className={styles.select}>
                            <Select
                                options={options}
                                value={targets[tx.id] ?? null}
                                onChange={(value) => setTargets((prev) => ({...prev, [tx.id]: value}))}
                                placeholder={t('categories.reassign.choose')}
                            />
                        </div>
                    </li>
                ))}
            </ul>

            <div className={styles.footer}>
                {transactions.length > PAGE_SIZE && (
                    <span className={styles.progress}>
                        {t('categories.reassign.progress', {chosen: chosenCount, total: transactions.length})}
                    </span>
                )}
                <Pagination
                    offset={offset}
                    pageSize={PAGE_SIZE}
                    total={transactions.length}
                    onPrevious={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                    onNext={() => setOffset((o) => o + PAGE_SIZE)}
                />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
                <Button onClick={onCancel} disabled={submitting}>
                    {t('common.cancel')}
                </Button>
                <Button variant="primary" className={styles.danger} onClick={handleSubmit} disabled={!canSubmit}>
                    {t('categories.reassign.confirm')}
                </Button>
            </div>
        </Modal>
    )
}
