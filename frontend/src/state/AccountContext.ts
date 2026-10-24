import {createContext, use} from 'react'
import type {Account, AccountDraft} from '../api/types'

export const FALLBACK_ACCOUNT: Account = {id: '1', name: 'Default', icon: 'bank'}

export interface AccountContextValue {
    accounts: Account[]
    activeAccount: Account
    selectAccount: (id: string) => Promise<void>
    createAccount: (draft: AccountDraft) => Promise<void>
    updateAccount: (id: string, draft: AccountDraft) => Promise<void>
    deleteAccount: (id: string) => Promise<void>
    reload: () => Promise<void>
}

export const AccountContext = createContext<AccountContextValue>({
    accounts: [FALLBACK_ACCOUNT],
    activeAccount: FALLBACK_ACCOUNT,
    selectAccount: () => Promise.resolve(),
    createAccount: () => Promise.resolve(),
    updateAccount: () => Promise.resolve(),
    deleteAccount: () => Promise.resolve(),
    reload: () => Promise.resolve(),
})

export function useAccount(): AccountContextValue {
    return use(AccountContext)
}
