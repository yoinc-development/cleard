import {useEffect, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useAccount} from '../../state/AccountContext'
import type {Account} from '../../api/types'
import {CheckIcon, ChevronUpDownIcon, PencilIcon, PlusIcon} from '../icons/icons'
import {AccountDialog} from './AccountDialog'
import {AccountGlyph} from './AccountGlyph'
import styles from './AccountSwitcher.module.css'

export function AccountSwitcher() {
    const {t} = useTranslation()
    const {accounts, activeAccount, selectAccount, createAccount, updateAccount, deleteAccount} = useAccount()
    const [open, setOpen] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<Account | null>(null)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return

        function handlePointerDown(event: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [open])

    async function handleSelect(id: string) {
        setOpen(false)
        if (id === activeAccount.id) return
        await selectAccount(id).catch(() => {
        })
    }

    return (
        <div className={styles.root} ref={rootRef}>
            {open && (
                <div className={styles.popover} role="listbox" aria-label={t('accounts.switch')}>
                    {accounts.map((account) => {
                        const active = account.id === activeAccount.id
                        return (
                            <div key={account.id} className={styles.row} role="presentation">
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={active}
                                    className={active ? `${styles.option} ${styles.optionActive}` : styles.option}
                                    onClick={() => handleSelect(account.id)}
                                >
                                    <AccountGlyph icon={account.icon}/>
                                    <span className={styles.optionName}>{account.name}</span>
                                    {active && <CheckIcon className={styles.check} width={16} height={16}/>}
                                </button>
                                <button
                                    type="button"
                                    className={styles.edit}
                                    aria-label={t('accounts.edit', {name: account.name})}
                                    title={t('accounts.edit', {name: account.name})}
                                    onClick={() => {
                                        setOpen(false)
                                        setEditing(account)
                                    }}
                                >
                                    <PencilIcon width={16} height={16}/>
                                </button>
                            </div>
                        )
                    })}
                    <div className={styles.divider}/>
                    <button
                        type="button"
                        className={`${styles.option} ${styles.add}`}
                        onClick={() => {
                            setOpen(false)
                            setDialogOpen(true)
                        }}
                    >
                        <PlusIcon/>
                        <span className={styles.optionName}>{t('accounts.add')}</span>
                    </button>
                </div>
            )}

            <button
                type="button"
                className={styles.trigger}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={t('accounts.switch')}
                onClick={() => setOpen((o) => !o)}
            >
                <span className={styles.tile}>
                    <AccountGlyph icon={activeAccount.icon}/>
                </span>
                <span className={styles.text}>
                    <span className={styles.caption}>{t('accounts.caption')}</span>
                    <span className={styles.name}>{activeAccount.name}</span>
                </span>
                <ChevronUpDownIcon className={styles.chevron} width={16} height={16}/>
            </button>

            {dialogOpen && <AccountDialog onClose={() => setDialogOpen(false)} onSubmit={createAccount}/>}

            {editing && (
                <AccountDialog
                    key={editing.id}
                    account={editing}
                    onClose={() => setEditing(null)}
                    onSubmit={(draft) => updateAccount(editing.id, draft)}
                    onDelete={accounts.length > 1 ? () => deleteAccount(editing.id) : undefined}
                />
            )}
        </div>
    )
}
