export type CategoryDirection = 'EXPENSE' | 'INCOME'

export interface Category {
    id: string
    name: string
    color: string
    direction: CategoryDirection
    monthToDateTotal: number
    monthToDateIn: number
    monthToDateOut: number
    monthToDateCount: number
    warningThreshold: number | null
}

export interface CategoryDraft {
    name: string
    color: string
    direction: CategoryDirection
    warningThreshold: number | null
}

export interface CategoryReassignment {
    transactionId: string
    categoryId: string
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
}

export interface MonthSummary {
    count: number
    countIn: number
    countOut: number
    totalIn: number
    totalOut: number
    net: number
}

export interface DailySpend {
    date: string
    totalOut: number
}

export interface TransactionDraft {
    txDate: string
    amount: number
    currency: string
    description: string
    categoryId: string | null
    tags: string[]
}

export interface AppSettings {
    currency: string
}

export interface VersionInfo {
    current: string | null
    latest: string | null
    updateAvailable: boolean
    releaseUrl: string | null
}
