import {useState} from 'react'
import type {FormEvent} from 'react'
import {useTranslation} from 'react-i18next'
import type {Account, AccountDraft, AccountIcon} from '../../api/types'
import {SafeTrans} from '../../i18n/SafeTrans'
import {Button} from '../Button/Button'
import {ConfirmDialog} from '../ConfirmDialog/ConfirmDialog'
import {Modal} from '../Modal/Modal'
import {AccountGlyph} from './AccountGlyph'
import styles from './AccountDialog.module.css'

export interface AccountDialogProps {
    account?: Account
    onClose: () => void
    onSubmit: (body: AccountDraft) => Promise<void>
    onDelete?: () => Promise<void>
}

const TITLE_ID = 'account-dialog-title'
const ICONS: AccountIcon[] = ['bank', 'card', 'savings', 'wallet']

export function AccountDialog({account, onClose, onSubmit, onDelete}: AccountDialogProps) {
    const {t} = useTranslation()
    const [name, setName] = useState(account?.name ?? '')
    const [icon, setIcon] = useState<AccountIcon>(account?.icon ?? 'bank')
    const [confirmingDelete, setConfirmingDelete] = useState(false)
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

    if (confirmingDelete && account && onDelete) {
        return (
            <ConfirmDialog
                title={t('accounts.delete.title')}
                confirmLabel={t('common.delete')}
                errorMessage={t('accounts.delete.error')}
                onCancel={() => setConfirmingDelete(false)}
                onConfirm={async () => {
                    await onDelete()
                    onClose()
                }}
            >
                <SafeTrans
                    i18nKey="accounts.delete.body"
                    values={{name: account.name}}
                    components={{strong: <strong/>}}
                />
            </ConfirmDialog>
        )
    }

    return (
        <Modal onClose={onClose} labelledBy={TITLE_ID} size="sm">
            <div className={styles.header}>
                <h2 className={styles.title} id={TITLE_ID}>
                    {account ? t('accounts.dialog.title_edit') : t('accounts.dialog.title')}
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
                                aria-label={t(`accounts.icon.${option}`)}
                                title={t(`accounts.icon.${option}`)}
                                className={icon === option ? `${styles.iconTile} ${styles.iconTileActive}` : styles.iconTile}
                                onClick={() => setIcon(option)}
                            >
                                <AccountGlyph icon={option} size={22}/>
                            </button>
                        ))}
                    </div>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.footer}>
                    {account && onDelete && (
                        <Button className={styles.delete} onClick={() => setConfirmingDelete(true)}
                                disabled={submitting}>
                            {t('common.delete')}
                        </Button>
                    )}
                    <Button onClick={onClose} disabled={submitting}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" variant="primary" disabled={!isValid || submitting}>
                        {account ? (
                            t('common.save')
                        ) : (
                            <>
                                {t('accounts.dialog.submit')} <span aria-hidden="true">· ⏎</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
