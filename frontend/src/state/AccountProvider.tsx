import {useCallback, useEffect, useMemo, useState} from 'react'
import type {ReactNode} from 'react'
import {useApi} from '../api/ApiContext'
import type {Account, AccountDraft} from '../api/types'
import {AccountContext, FALLBACK_ACCOUNT} from './AccountContext'
import type {AccountContextValue} from './AccountContext'
import {useSettings} from './SettingsContext'

export function AccountProvider({children}: { children: ReactNode }) {
    const api = useApi()
    const {activeAccountId, loaded, reload: reloadSettings} = useSettings()
    const [accounts, setAccounts] = useState<Account[] | null>(null)

    const reload = useCallback(async () => {
        try {
            setAccounts(await api.listAccounts())
        } catch {
            setAccounts((current) => current ?? [])
        }
        await reloadSettings()
    }, [api, reloadSettings])

    useEffect(() => {
        api.listAccounts().then(setAccounts, () => setAccounts([]))
    }, [api])

    const selectAccount = useCallback(
        async (id: string) => {
            await api.updateSettings({activeAccountId: id})
            await reloadSettings()
        },
        [api, reloadSettings],
    )

    const createAccount = useCallback(
        async (draft: AccountDraft) => {
            const created = await api.createAccount(draft)
            setAccounts((current) => [...(current ?? []), created])
            await selectAccount(created.id)
        },
        [api, selectAccount],
    )

    const updateAccount = useCallback(
        async (id: string, draft: AccountDraft) => {
            const updated = await api.updateAccount(id, draft)
            setAccounts((current) => (current ?? []).map((account) => (account.id === id ? updated : account)))
        },
        [api],
    )

    const deleteAccount = useCallback(
        async (id: string) => {
            await api.deleteAccount(id)
            await reload()
        },
        [api, reload],
    )

    const value = useMemo<AccountContextValue>(() => {
        const list = accounts ?? []
        const activeAccount = list.find((a) => a.id === activeAccountId) ?? list[0] ?? FALLBACK_ACCOUNT
        return {accounts: list, activeAccount, selectAccount, createAccount, updateAccount, deleteAccount, reload}
    }, [accounts, activeAccountId, selectAccount, createAccount, updateAccount, deleteAccount, reload])

    if (accounts === null || !loaded) return null

    return <AccountContext value={value}>{children}</AccountContext>
}
