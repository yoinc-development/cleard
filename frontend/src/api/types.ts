export type CategoryDirection = 'EXPENSE' | 'INCOME'

export interface Category {
  id: string
  name: string
  color: string
  direction: CategoryDirection
  monthToDateTotal: number
  monthToDateCount: number
  warningThreshold: number | null
}

export interface CategoryDraft {
  name: string
  color: string
  direction: CategoryDirection
  warningThreshold: number | null
}

export interface Tag {
  name: string
  count: number
}

export interface Transaction {
  id: string
  date: string
  amount: number
  currency: string
  description: string
  categoryId: string | null
  tags: string[]
  runningBalance: number | null
}

export interface TransactionQuery {
  month: string
  categoryIds?: string[]
  tags?: string[]
  q?: string
  limit: number
  offset: number
}

export interface TransactionPage {
  transactions: Transaction[]
  filteredCount: number
  remainingCount: number
}

export interface MonthSummary {
  count: number
  totalIn: number
  totalOut: number
  net: number
}

export interface NewTransaction {
  date: string
  amount: number
  currency: string
  description: string
  categoryId: string | null
  tags: string[]
}
