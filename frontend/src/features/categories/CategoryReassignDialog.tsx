import {useState} from 'react'
import type {Category, CategoryReassignment, Transaction} from '../../api/types'
import {Button} from '../../components/Button/Button'
import {Modal} from '../../components/Modal/Modal'
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

export function CategoryReassignDialog({
                                           category,
                                           transactions,
                                           categories,
                                           onCancel,
                                           onConfirm,
                                       }: CategoryReassignDialogProps) {
    const [targets, setTargets] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const options = categories
        .filter((c) => c.id !== category.id)
        .map((c) => ({value: c.id, label: c.name, color: c.color}))

    const allChosen = transactions.every((t) => targets[t.id])
    const canSubmit = allChosen && options.length > 0 && !submitting

    async function handleSubmit() {
        if (!canSubmit) return
        setSubmitting(true)
        setError(null)
        try {
            await onConfirm(
                transactions.map((t) => ({transactionId: t.id, categoryId: targets[t.id]})),
            )
        } catch {
            setError('Could not delete the category. Its transactions may have changed - close this dialog and try again.')
            setSubmitting(false)
        }
    }

    return (
        <Modal onClose={onCancel} labelledBy={TITLE_ID}>
            <div className={styles.header}>
                <h2 className={styles.title} id={TITLE_ID}>
                    Delete · {category.name}
                </h2>
                <span className={styles.hint}>Esc to cancel</span>
            </div>

            <p className={styles.intro}>
                {transactions.length === 1
                    ? '1 transaction uses this category.'
                    : `${transactions.length} transactions use this category.`}{' '}
                Choose a new category for each before deleting.
            </p>

            {options.length === 0 && (
                <p className={styles.error}>Create another category first, there is nothing to reassign to.</p>
            )}

            <ul className={styles.list}>
                {transactions.map((t) => (
                    <li key={t.id} className={styles.row}>
                        <span className={styles.date}>{formatShortDate(t.date)}</span>
                        <span className={styles.description}>{t.description}</span>
                        <div className={styles.select}>
                            <Select
                                options={options}
                                value={targets[t.id] ?? null}
                                onChange={(value) => setTargets((prev) => ({...prev, [t.id]: value}))}
                                placeholder="Choose category…"
                            />
                        </div>
                    </li>
                ))}
            </ul>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
                <Button onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
                <Button variant="primary" className={styles.danger} onClick={handleSubmit} disabled={!canSubmit}>
                    Reassign &amp; delete
                </Button>
            </div>
        </Modal>
    )
}
