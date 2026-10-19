import {useState} from 'react'
import type {FormEvent} from 'react'
import {useTranslation} from 'react-i18next'
import type {AccountDraft, AccountIcon} from '../../api/types'
import {Button} from '../Button/Button'
import {Modal} from '../Modal/Modal'
import {AccountGlyph} from './AccountGlyph'
import styles from './AccountDialog.module.css'

export interface AccountDialogProps {
    onClose: () => void
    onSubmit: (body: AccountDraft) => Promise<void>
}

const TITLE_ID = 'account-dialog-title'
const ICONS: AccountIcon[] = ['bank', 'card', 'savings', 'wallet']

export function AccountDialog({onClose, onSubmit}: AccountDialogProps) {
    const {t} = useTranslation()
    const [name, setName] = useState('')
    const [icon, setIcon] = useState<AccountIcon>('bank')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isValid = name.trim().length > 0

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        if (!isValid || submitting) return

        setSubmitting(true)
        setError(null)
        try {
            await onSubmit({name: name.trim(), icon})
            onClose()
        } catch {
            setError(t('accounts.dialog.error'))
            setSubmitting(false)
        }
    }

    return (
        <Modal onClose={onClose} labelledBy={TITLE_ID} size="sm">
            <div className={styles.header}>
                <h2 className={styles.title} id={TITLE_ID}>
                    {t('accounts.dialog.title')}
                </h2>
                <span className={styles.hint}>{t('common.hint_cancel')}</span>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="account-name">
                        {t('accounts.dialog.name')}
                    </label>
                    <input
                        id="account-name"
                        type="text"
                        className={styles.input}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={100}
                        autoComplete="off"
                    />
                </div>

                <div className={styles.field}>
                    <span className={styles.label} id="account-icon-label">
                        {t('accounts.dialog.icon')}
                    </span>
                    <div className={styles.icons} role="radiogroup" aria-labelledby="account-icon-label">
                        {ICONS.map((option) => (
                            <button
                                key={option}
                                type="button"
                                role="radio"
                                aria-checked={icon === option}
                                className={icon === option ? `${styles.iconTile} ${styles.iconTileActive}` : styles.iconTile}
                                onClick={() => setIcon(option)}
                            >
                                <AccountGlyph icon={option}/>
                                <span>{t(`accounts.icon.${option}`)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.footer}>
                    <Button onClick={onClose} disabled={submitting}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" variant="primary" disabled={!isValid || submitting}>
                        {t('accounts.dialog.submit')} <span aria-hidden="true">· ⏎</span>
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
