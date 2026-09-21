import type {
  Category,
  CategoryDraft,
  MonthSummary,
  Tag,
  Transaction,
  TransactionDraft,
  TransactionPage,
  TransactionQuery,
} from './types'

export interface TransactionsApi {
  listTransactions(query: TransactionQuery): Promise<TransactionPage>
  createTransaction(body: TransactionDraft): Promise<Transaction>
  listCategories(month: string): Promise<Category[]>
  createCategory(body: CategoryDraft): Promise<Category>
  updateCategory(id: string, body: CategoryDraft): Promise<Category>
  listTags(month: string): Promise<Tag[]>
  getMonthSummary(month: string): Promise<MonthSummary>
}
