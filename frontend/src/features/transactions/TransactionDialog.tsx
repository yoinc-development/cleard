import {useState} from 'react'
import type {FormEvent, KeyboardEvent} from 'react'
import {useTranslation} from 'react-i18next'
import {Button} from '../../components/Button/Button'
import {Modal} from '../../components/Modal/Modal'
import {Select} from '../../components/Select/Select'
import type {SelectOption} from '../../components/Select/Select'
import {TagPill} from '../../components/TagPill/TagPill'
import {MinusIcon, PlusIcon} from '../../components/icons/icons'
import {formatMoney} from '../../lib/format'
import type {Category, Transaction, TransactionDraft} from '../../api/types'
import {useSettings} from '../../state/SettingsContext'
import styles from './TransactionDialog.module.css'

export interface TransactionDialogProps {
    categories: Category[]
    defaultDate: string
    transaction?: Transaction
    onClose: () => void
    onSubmit: (body: TransactionDraft) => Promise<void>
}

const TITLE_ID = 'transaction-dialog-title'

export function TransactionDialog({
                                      categories,
                                      defaultDate,
                                      transaction,
                                      onClose,
                                      onSubmit,
                                  }: TransactionDialogProps) {
    const {t} = useTranslation()
    const {currency} = useSettings()
    const editing = transaction !== undefined
    const [date, setDate] = useState(transaction?.date ?? defaultDate)
    const [sign, setSign] = useState<1 | -1>(transaction && transaction.amount > 0 ? 1 : -1)
    const [amountText, setAmountText] = useState(
        transaction ? String(Math.abs(transaction.amount)) : '',
    )
    const [description, setDescription] = useState(transaction?.description ?? '')
    const [categoryId, setCategoryId] = useState<string | null>(transaction?.categoryId ?? null)
    const [tags, setTags] = useState<string[]>(transaction?.tags ?? [])
    const [tagDraft, setTagDraft] = useState('')
    const [keepOpen, setKeepOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const amountValue = Number(amountText)
    const isValid =
        description.trim().length > 0 &&
        Boolean(categoryId) &&
        amountText.trim().length > 0 &&
        Number.isFinite(amountValue) &&
        amountValue > 0

    const categoryOptions: SelectOption[] = categories.map((category) => ({
        value: category.id,
        label: category.name,
        color: category.color,
        meta:
            category.monthToDateCount > 0
                ? t('transactions.dialog.category_meta', {amount: formatMoney(category.monthToDateTotal, {sign: false})})
                : undefined,
    }))

    function handleCategoryChange(id: string) {
        setCategoryId(id)
        const picked = categories.find((category) => category.id === id)
        if (picked) setSign(picked.direction === 'INCOME' ? 1 : -1)
    }

    function addTag(raw: string) {
        const value = raw.trim()
        if (!value || tags.includes(value)) return
        setTags((current) => [...current, value])
    }

    function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault()
            addTag(tagDraft)
            setTagDraft('')
        } else if (event.key === 'Backspace' && tagDraft === '' && tags.length > 0) {
            setTags((current) => current.slice(0, -1))
        }
    }

    function resetForKeepOpen() {
        setAmountText('')
        setDescription('')
        setTags([])
        setTagDraft('')
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        if (!isValid || submitting || !categoryId) return

        setSubmitting(true)
        setError(null)
        try {
            await onSubmit({
                txDate: date,
                amount: sign * amountValue,
                currency,
                description: description.trim(),
                categoryId,
                tags,
            })
            if (keepOpen) {
                resetForKeepOpen()
            } else {
                onClose()
            }
        } catch {
            setError(t('transactions.dialog.error'))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Modal onClose={onClose} labelledBy={TITLE_ID}>
            <div className={styles.header}>
                <h2 className={styles.title} id={TITLE_ID}>
                    {editing ? t('transactions.dialog.title_edit') : t('transactions.dialog.title_new')}
                </h2>
                <span className={styles.hint}>{t('common.hint_cancel')}</span>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="tx-date">
                            {t('common.date')}
                        </label>
                        <input
                            id="tx-date"
                            type="date"
                            className={styles.input}
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <span className={styles.label} id="tx-category-label">
                            {t('common.category')}
                        </span>
                        <Select
                            id="tx-category"
                            options={categoryOptions}
                            value={categoryId}
                            onChange={handleCategoryChange}
                            placeholder={t('transactions.dialog.category_placeholder')}
                        />
                    </div>
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <span className={styles.label} id="tx-direction-label">
                            {t('common.direction')}
                        </span>
                        <div className={styles.signToggle} role="group" aria-labelledby="tx-direction-label">
                            <button
                                type="button"
                                className={`${styles.signButton} ${sign === -1 ? styles.signButtonActive : ''}`}
                                onClick={() => setSign(-1)}
                                aria-pressed={sign === -1}
                                aria-label={t('common.expense')}
                            >
                                <MinusIcon width={14} height={14}/>
                                {t('common.expense')}
                            </button>
                            <button
                                type="button"
                                className={`${styles.signButton} ${sign === 1 ? styles.signButtonActive : ''}`}
                                onClick={() => setSign(1)}
                                aria-pressed={sign === 1}
                                aria-label={t('common.income')}
                            >
                                <PlusIcon width={14} height={14}/>
                                {t('common.income')}
                            </button>
                        </div>
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="tx-amount">
                            {t('common.amount')}
                        </label>
                        <div className={styles.amountInputWrap}>
                            <input
                                id="tx-amount"
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.01"
                                className={styles.amountInput}
                                value={amountText}
                                onChange={(event) => setAmountText(event.target.value)}
                                placeholder="0.00"
                                required
                            />
                            <span className={styles.currency}>{currency}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="tx-description">
                            {t('common.description')}
                        </label>
                        <input
                            id="tx-description"
                            type="text"
                            className={styles.input}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <span className={styles.label} id="tx-tags-label">
                            {t('common.tags')}
                        </span>
                        <div className={styles.tagsField} aria-labelledby="tx-tags-label">
                            {tags.map((tag) => (
                                <TagPill key={tag} name={tag}
                                         onRemove={() => setTags((c) => c.filter((t) => t !== tag))}/>
                            ))}
                            <input
                                type="text"
                                className={styles.tagInput}
                                value={tagDraft}
                                onChange={(event) => setTagDraft(event.target.value)}
                                onKeyDown={handleTagKeyDown}
                                onBlur={() => {
                                    addTag(tagDraft)
                                    setTagDraft('')
                                }}
                                placeholder={t('transactions.dialog.tag_placeholder')}
                            />
                        </div>
                    </div>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.footer}>
                    {!editing && (
                        <label className={styles.keepOpen}>
                            <input
                                type="checkbox"
                                checked={keepOpen}
                                onChange={(event) => setKeepOpen(event.target.checked)}
                            />
                            {t('transactions.dialog.keep_open')}
                        </label>
                    )}
                    <div className={styles.footerActions}>
                        <Button onClick={onClose} disabled={submitting}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" variant="primary" disabled={!isValid || submitting}>
                            {t('common.save')} · ⏎
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    )
}
