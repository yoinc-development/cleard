import { createContext, use } from 'react'
import type { TransactionsApi } from './TransactionsApi'

export const ApiContext = createContext<TransactionsApi | null>(null)

export function useApi(): TransactionsApi {
  const api = use(ApiContext)
  if (!api) {
    throw new Error('useApi() called outside an <ApiProvider>')
  }
  return api
}
