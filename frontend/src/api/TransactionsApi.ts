import type {
    AppSettings,
    AppSettingsUpdate,
    Category,
    CategoryDraft,
    CategoryReassignment,
    DailySpend,
    MonthSummary,
    Tag,
    Transaction,
    TransactionDraft,
    TransactionPage,
    TransactionQuery,
    VersionInfo,
} from './types'

export interface TransactionsApi {
    listTransactions(query: TransactionQuery): Promise<TransactionPage>

    createTransaction(body: TransactionDraft): Promise<Transaction>

    updateTransaction(id: string, body: TransactionDraft): Promise<Transaction>

    deleteTransaction(id: string): Promise<void>

    listCategories(month: string): Promise<Category[]>

    createCategory(body: CategoryDraft): Promise<Category>

    updateCategory(id: string, body: CategoryDraft): Promise<Category>

    listCategoryTransactions(categoryId: string): Promise<Transaction[]>

    deleteCategory(id: string, reassignments: CategoryReassignment[]): Promise<void>

    listTags(month: string): Promise<Tag[]>

    getMonthSummary(month: string): Promise<MonthSummary>

    getDailySpend(month: string): Promise<DailySpend[]>

    getSettings(): Promise<AppSettings>

    updateSettings(body: AppSettingsUpdate): Promise<AppSettings>

    clearAllData(): Promise<void>

    getVersionInfo(): Promise<VersionInfo>
}
