import {useState} from 'react'
import type {ReactNode} from 'react'
import {Button} from '../Button/Button'
import {Modal} from '../Modal/Modal'
import styles from './ConfirmDialog.module.css'

export interface ConfirmDialogProps {
    title: string
    confirmLabel: string
    onConfirm: () => Promise<void>
    onCancel: () => void
    children: ReactNode
    errorMessage?: string
}

const TITLE_ID = 'confirm-dialog-title'

export function ConfirmDialog({
                                  title,
                                  confirmLabel,
                                  onConfirm,
                                  onCancel,
                                  children,
                                  errorMessage = 'Could not complete the action. Please try again.',
                              }: ConfirmDialogProps) {
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleConfirm() {
        if (submitting) return
        setSubmitting(true)
        setError(null)
        try {
            await onConfirm()
        } catch {
            setError(errorMessage)
            setSubmitting(false)
        }
    }

    return (
        <Modal onClose={onCancel} labelledBy={TITLE_ID}>
            <div className={styles.root}>
                <h2 className={styles.title} id={TITLE_ID}>
                    {title}
                </h2>
                <div className={styles.body}>{children}</div>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.actions}>
                    <Button onClick={onCancel} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button variant="primary" className={styles.danger} onClick={handleConfirm} disabled={submitting}>
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
