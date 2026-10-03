import {useState} from 'react'
import type {FormEvent} from 'react'
import {useTranslation} from 'react-i18next'
import {Button} from '../../components/Button/Button'
import {ColorPicker} from '../../components/ColorPicker/ColorPicker'
import {DEFAULT_CATEGORY_COLOR} from '../../lib/color'
import type {Category, CategoryDirection, CategoryDraft} from '../../api/types'
import {useSettings} from '../../state/SettingsContext'
import styles from './CategoryEditor.module.css'

export interface CategoryEditorProps {
    category: Category | null
    onCancel: () => void
    onSubmit: (body: CategoryDraft) => Promise<void>
    onDelete?: () => Promise<void>
}

/** category === null means create mode. */
export function CategoryEditor({category, onCancel, onSubmit, onDelete}: CategoryEditorProps) {
    const {t} = useTranslation()
    const {currency} = useSettings()
    const [name, setName] = useState(category?.name ?? '')
    const [color, setColor] = useState(category?.color ?? DEFAULT_CATEGORY_COLOR)
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
            setError(t('categories.editor.error_save'))
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDelete() {
        if (!onDelete || submitting) return
        setSubmitting(true)
        setError(null)
        try {
            await onDelete()
        } catch {
            setError(t('categories.editor.error_load_transactions'))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className={styles.wrap}>
            <p className={styles.eyebrow}>{category ? t('categories.editor.editing', {name: category.name}) : t('categories.new')}</p>

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="category-name">
                        {t('common.name')}
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
                    <label className={styles.label} htmlFor="category-color">
                        {t('categories.editor.color')}
                    </label>
                    <ColorPicker id="category-color" value={color} onChange={setColor}/>
                </div>

                <div className={styles.field}>
          <span className={styles.label} id="category-direction-label">
            {t('common.direction')}
          </span>
                    <div className={styles.directionToggle} role="group" aria-labelledby="category-direction-label">
                        <button
                            type="button"
                            className={`${styles.directionButton} ${direction === 'EXPENSE' ? styles.directionButtonActive : ''}`}
                            onClick={() => setDirection('EXPENSE')}
                            aria-pressed={direction === 'EXPENSE'}
                        >
                            {t('common.expense')}
                        </button>
                        <button
                            type="button"
                            className={`${styles.directionButton} ${direction === 'INCOME' ? styles.directionButtonActive : ''}`}
                            onClick={() => setDirection('INCOME')}
                            aria-pressed={direction === 'INCOME'}
                        >
                            {t('common.income')}
                        </button>
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="category-threshold">
                        {t('categories.editor.threshold')}
                    </label>
                    <div className={styles.amountInputWrap}>
                        <input
                            id="category-threshold"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            className={styles.amountInput}
                            value={thresholdText}
                            onChange={(event) => setThresholdText(event.target.value)}
                            placeholder="0.00"
                        />
                        <span className={styles.currency}>{t('categories.editor.per_month', {currency})}</span>
                    </div>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.footer}>
                    <Button type="submit" variant="primary" disabled={!isValid || submitting}>
                        {t('common.save')}
                    </Button>
                    <Button onClick={onCancel} disabled={submitting}>
                        {t('common.cancel')}
                    </Button>
                    {category && onDelete && (
                        <Button className={styles.delete} onClick={handleDelete} disabled={submitting}>
                            {t('common.delete')}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    )
}
