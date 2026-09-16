import type {
  Category,
  MonthSummary,
  NewTransaction,
  Tag,
  Transaction,
  TransactionPage,
  TransactionQuery,
} from './types'

export interface TransactionsApi {
  listTransactions(query: TransactionQuery): Promise<TransactionPage>
  createTransaction(body: NewTransaction): Promise<Transaction>
  listCategories(month: string): Promise<Category[]>
  listTags(month: string): Promise<Tag[]>
  getMonthSummary(month: string): Promise<MonthSummary>
}
