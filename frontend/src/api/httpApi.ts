import type {TransactionsApi} from './TransactionsApi'
import type {
    Category,
    CategoryDraft,
    DailySpend,
    MonthSummary,
    Tag,
    Transaction,
    TransactionDraft,
    TransactionPage,
    TransactionQuery,
} from './types'

/**
 * No component should ever import this module directly - see ApiContext.
 */

const BASE_URL = '/api'

interface RawTransactionPageResponse {
    transactions: {
        id: string
        date: string
        amount: number
        currency: string
        description: string
        categoryId: string | null
        tags: string[]
        runningBalance: number | null
    }[]
    filteredCount: number
    remainingCount: number
}

function buildQueryString(query: TransactionQuery): string {
    const params = new URLSearchParams()
    params.set('month', query.month)
    params.set('limit', String(query.limit))
    params.set('offset', String(query.offset))
    if (query.categoryIds?.length) params.set('categoryIds', query.categoryIds.join(','))
    if (query.tags?.length) params.set('tags', query.tags.join(','))
    if (query.q) params.set('q', query.q)
    return params.toString()
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: {'Content-Type': 'application/json'},
        ...init,
    })
    if (!response.ok) {
        throw new Error(`Request to ${path} failed: ${response.status} ${response.statusText}`)
    }
    return (await response.json()) as T
}

async function requestNoContent(path: string, init: RequestInit): Promise<void> {
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: {'Content-Type': 'application/json'},
        ...init,
    })
    if (!response.ok) {
        throw new Error(`Request to ${path} failed: ${response.status} ${response.statusText}`)
    }
}

export const httpApi: TransactionsApi = {
    async listTransactions(query: TransactionQuery): Promise<TransactionPage> {
        const raw = await requestJson<RawTransactionPageResponse>(`/transactions?${buildQueryString(query)}`)
        return {
            filteredCount: raw.filteredCount,
            remainingCount: raw.remainingCount,
            transactions: raw.transactions.map((t) => ({
                id: String(t.id),
                date: t.date,
                amount: t.amount,
                currency: t.currency,
                description: t.description,
                categoryId: t.categoryId,
                tags: t.tags,
                runningBalance: t.runningBalance,
            })),
        }
    },

    createTransaction(body: TransactionDraft): Promise<Transaction> {
        return requestJson<Transaction>('/transactions', {
            method: 'POST',
            body: JSON.stringify(body),
        })
    },

    updateTransaction(id: string, body: TransactionDraft): Promise<Transaction> {
        return requestJson<Transaction>(`/transactions/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(body),
        })
    },

    deleteTransaction(id: string): Promise<void> {
        return requestNoContent(`/transactions/${encodeURIComponent(id)}`, {method: 'DELETE'})
    },

    listCategories(month: string): Promise<Category[]> {
        return requestJson<Category[]>(`/categories?month=${encodeURIComponent(month)}`)
    },

    createCategory(body: CategoryDraft): Promise<Category> {
        return requestJson<Category>('/categories', {
            method: 'POST',
            body: JSON.stringify(body),
        })
    },

    updateCategory(id: string, body: CategoryDraft): Promise<Category> {
        return requestJson<Category>(`/categories/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(body),
        })
    },

    listTags(month: string): Promise<Tag[]> {
        return requestJson<Tag[]>(`/tags?month=${encodeURIComponent(month)}`)
    },

    getMonthSummary(month: string): Promise<MonthSummary> {
        return requestJson<MonthSummary>(`/transactions/summary?month=${encodeURIComponent(month)}`)
    },

    getDailySpend(month: string): Promise<DailySpend[]> {
        return requestJson<DailySpend[]>(`/transactions/daily-spend?month=${encodeURIComponent(month)}`)
    },
}
