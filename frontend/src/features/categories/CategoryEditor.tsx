import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../components/Button/Button'
import { ColorPicker } from '../../components/ColorPicker/ColorPicker'
import { CATEGORY_COLORS } from '../../lib/color'
import type { Category, CategoryDirection, CategoryDraft } from '../../api/types'
import styles from './CategoryEditor.module.css'

export interface CategoryEditorProps {
  category: Category | null
  onCancel: () => void
  onSubmit: (body: CategoryDraft) => Promise<void>
}

/** category === null means create mode. */
export function CategoryEditor({ category, onCancel, onSubmit }: CategoryEditorProps) {
  const [name, setName] = useState(category?.name ?? '')
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0])
  const [direction, setDirection] = useState<CategoryDirection>(category?.direction ?? 'EXPENSE')
  const [thresholdText, setThresholdText] = useState(
    category?.warningThreshold != null ? String(category.warningThreshold) : '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = name.trim().length > 0

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isValid || submitting) return

    setSubmitting(true)
    setError(null)
    try {
      const threshold = thresholdText.trim()
      await onSubmit({
        name: name.trim(),
        color,
        direction,
        warningThreshold: threshold ? Number(threshold) : null,
      })
    } catch {
      setError('Could not save the category. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.eyebrow}>{category ? `Editing · ${category.name}` : 'New category'}</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="category-name">
            Name
          </label>
          <input
            id="category-name"
            type="text"
            className={styles.input}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label} id="category-color-label">
            Color
          </span>
          <ColorPicker id="category-color-label" value={color} onChange={setColor} />
        </div>

        <div className={styles.field}>
          <span className={styles.label} id="category-direction-label">
            Direction
          </span>
          <div className={styles.directionToggle} role="group" aria-labelledby="category-direction-label">
            <button
              type="button"
              className={`${styles.directionButton} ${direction === 'EXPENSE' ? styles.directionButtonActive : ''}`}
              onClick={() => setDirection('EXPENSE')}
              aria-pressed={direction === 'EXPENSE'}
            >
              Expense
            </button>
            <button
              type="button"
              className={`${styles.directionButton} ${direction === 'INCOME' ? styles.directionButtonActive : ''}`}
              onClick={() => setDirection('INCOME')}
              aria-pressed={direction === 'INCOME'}
            >
              Income
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="category-threshold">
            Warning threshold · optional
          </label>
          <div className={styles.amountInputWrap}>
            <input
              id="category-threshold"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.05"
              className={styles.amountInput}
              value={thresholdText}
              onChange={(event) => setThresholdText(event.target.value)}
              placeholder="0.00"
            />
            <span className={styles.currency}>CHF / month</span>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.footer}>
          <Button type="submit" variant="primary" disabled={!isValid || submitting}>
            Save
          </Button>
          <Button onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
