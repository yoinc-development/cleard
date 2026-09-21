import type { ReactNode } from 'react'
import { ApiContext } from './ApiContext'
import type { TransactionsApi } from './TransactionsApi'

export function ApiProvider({ api, children }: { api: TransactionsApi; children: ReactNode }) {
  return <ApiContext value={api}>{children}</ApiContext>
}
