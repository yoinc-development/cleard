import { useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Button } from '../../components/Button/Button'
import { Modal } from '../../components/Modal/Modal'
import { Select } from '../../components/Select/Select'
import type { SelectOption } from '../../components/Select/Select'
import { TagPill } from '../../components/TagPill/TagPill'
import { MinusIcon, PlusIcon } from '../../components/icons/icons'
import { formatMoney } from '../../lib/format'
import type { Category, NewTransaction } from '../../api/types'
import styles from './NewTransactionDialog.module.css'

export interface NewTransactionDialogProps {
  categories: Category[]
  defaultDate: string
  onClose: () => void
  onSubmit: (body: NewTransaction) => Promise<void>
}

const TITLE_ID = 'new-transaction-title'

export function NewTransactionDialog({
  categories,
  defaultDate,
  onClose,
  onSubmit,
}: NewTransactionDialogProps) {
  const [date, setDate] = useState(defaultDate)
  const [sign, setSign] = useState<1 | -1>(-1)
  const [amountText, setAmountText] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
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
    colour: category.colour,
    meta:
      category.monthToDateCount > 0
        ? `${formatMoney(category.monthToDateTotal, { sign: false })} this month`
        : undefined,
  }))

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
        date,
        amount: sign * amountValue,
        currency: 'CHF',
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
      setError('Could not save the transaction. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal onClose={onClose} labelledBy={TITLE_ID}>
      <div className={styles.header}>
        <h2 className={styles.title} id={TITLE_ID}>
          New transaction
        </h2>
        <span className={styles.hint}>Esc to cancel</span>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tx-date">
              Date
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
          <div className={`${styles.field} ${styles.amountField}`}>
            <label className={styles.label} htmlFor="tx-amount">
              Amount · sign sets direction
            </label>
            <div className={styles.amountRow}>
              <div className={styles.signToggle} role="group" aria-label="Direction">
                <button
                  type="button"
                  className={`${styles.signButton} ${sign === -1 ? styles.signButtonActive : ''}`}
                  onClick={() => setSign(-1)}
                  aria-pressed={sign === -1}
                  aria-label="Expense"
                >
                  <MinusIcon width={14} height={14} />
                </button>
                <button
                  type="button"
                  className={`${styles.signButton} ${sign === 1 ? styles.signButtonActive : ''}`}
                  onClick={() => setSign(1)}
                  aria-pressed={sign === 1}
                  aria-label="Income"
                >
                  <PlusIcon width={14} height={14} />
                </button>
              </div>
              <div className={styles.amountInputWrap}>
                <input
                  id="tx-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.05"
                  className={styles.amountInput}
                  value={amountText}
                  onChange={(event) => setAmountText(event.target.value)}
                  placeholder="0.00"
                  required
                />
                <span className={styles.currency}>CHF</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="tx-description">
            Description
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
          <span className={styles.label} id="tx-category-label">
            Category
          </span>
          <Select
            id="tx-category-label"
            options={categoryOptions}
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Select a category"
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label} id="tx-tags-label">
            Tags
          </span>
          <div className={styles.tagsField} aria-labelledby="tx-tags-label">
            {tags.map((tag) => (
              <TagPill key={tag} name={tag} onRemove={() => setTags((c) => c.filter((t) => t !== tag))} />
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
              placeholder="Add a tag…"
            />
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.footer}>
          <label className={styles.keepOpen}>
            <input
              type="checkbox"
              checked={keepOpen}
              onChange={(event) => setKeepOpen(event.target.checked)}
            />
            Keep open to add another
          </label>
          <div className={styles.footerActions}>
            <Button onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!isValid || submitting}>
              Save · ⏎
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
