import { useEffect, useState } from 'react'
import { useApi } from '../../api/ApiContext'
import type { TransactionsApi } from '../../api/TransactionsApi'
import type { Category, MonthSummary, Tag, Transaction } from '../../api/types'
import { Button } from '../../components/Button/Button'
import { Card } from '../../components/Card/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { MonthNav } from '../../components/MonthNav/MonthNav'
import { PageHeader } from '../../components/PageHeader/PageHeader'
import { PlusIcon } from '../../components/icons/icons'
import { formatMoneyWithCurrency, formatShortDate, todayIso } from '../../lib/format'
import { useMonth } from '../../state/MonthContext'
import { FilterBar } from './FilterBar'
import { FiltersPopover } from './FiltersPopover'
import { TransactionDialog } from './TransactionDialog'
import { TransactionTable } from './TransactionTable'
import styles from './TransactionsPage.module.css'

const PAGE_SIZE = 15

async function fetchReferenceData(api: TransactionsApi, month: string) {
  const [categories, tags, summary] = await Promise.allSettled([
    api.listCategories(month),
    api.listTags(month),
    api.getMonthSummary(month),
  ])
  return {
    categories: categories.status === 'fulfilled' ? categories.value : [],
    tags: tags.status === 'fulfilled' ? tags.value : [],
    summary: summary.status === 'fulfilled' ? summary.value : null,
  }
}

export function TransactionsPage() {
  const api = useApi()
  const { selected } = useMonth()

  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [summary, setSummary] = useState<MonthSummary | null>(null)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [remainingCount, setRemainingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [rawSearch, setRawSearch] = useState('')
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(rawSearch), 200)
    return () => clearTimeout(timeout)
  }, [rawSearch])

  const queryKey = `${selected.key}|${selectedCategoryIds.join(',')}|${selectedTags.join(',')}|${search}`
  const [lastQueryKey, setLastQueryKey] = useState(queryKey)
  if (queryKey !== lastQueryKey) {
    setLastQueryKey(queryKey)
    setLimit(PAGE_SIZE)
    setLoading(true)
    setLoadError(null)
  }

  useEffect(() => {
    let ignore = false
    fetchReferenceData(api, selected.key).then((result) => {
      if (ignore) return
      setCategories(result.categories)
      setTags(result.tags)
      setSummary(result.summary)
    })
    return () => {
      ignore = true
    }
  }, [api, selected.key])

  useEffect(() => {
    let ignore = false
    api
      .listTransactions({
        month: selected.key,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        q: search || undefined,
        limit,
        offset: 0,
      })
      .then(
        (page) => {
          if (ignore) return
          setTransactions(page.transactions)
          setRemainingCount(page.remainingCount)
          setLoading(false)
        },
        () => {
          if (ignore) return
          setTransactions([])
          setRemainingCount(0)
          setLoading(false)
          setLoadError('Could not load transactions.')
        },
      )
    return () => {
      ignore = true
    }
  }, [api, selected.key, selectedCategoryIds, selectedTags, search, limit])

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    )
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]))
  }

  const today = todayIso()
  const defaultDate = selected.key === today.slice(0, 7) ? today : `${selected.key}-01`

  async function refresh() {
    const [page, reference] = await Promise.all([
      api.listTransactions({
        month: selected.key,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        q: search || undefined,
        limit,
        offset: 0,
      }),
      fetchReferenceData(api, selected.key),
    ])
    setTransactions(page.transactions)
    setRemainingCount(page.remainingCount)
    setCategories(reference.categories)
    setTags(reference.tags)
    setSummary(reference.summary)
  }

  return (
    <div className={styles.page}>
      <PageHeader
        left={<MonthNav />}
        meta={
          summary &&
          `${summary.count} transactions · ${formatMoneyWithCurrency(summary.totalOut)} out, ${formatMoneyWithCurrency(summary.totalIn)} in`
        }
        actions={
          <>
            <FiltersPopover
              categories={categories}
              tags={tags}
              selectedCategoryIds={selectedCategoryIds}
              selectedTags={selectedTags}
              onToggleCategory={toggleCategory}
              onToggleTag={toggleTag}
            />
            <Button variant="primary" onClick={() => setDialogOpen(true)}>
              <PlusIcon width={16} height={16} />
              Add transaction
            </Button>
          </>
        }
      />

      <FilterBar
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
        selectedTags={selectedTags}
        onClearCategories={() => setSelectedCategoryIds([])}
        onClearTags={() => setSelectedTags([])}
        onClearAll={() => {
          setSelectedCategoryIds([])
          setSelectedTags([])
        }}
        search={rawSearch}
        onSearchChange={setRawSearch}
      />

      {loadError ? (
        <Card className={styles.error}>{loadError}</Card>
      ) : (
        <TransactionTable
          transactions={transactions}
          categories={categories}
          remainingCount={remainingCount}
          onLoadMore={() => {
            setLoading(true)
            setLimit((current) => current + PAGE_SIZE)
          }}
          loading={loading}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      )}

      {dialogOpen && (
        <TransactionDialog
          categories={categories}
          defaultDate={defaultDate}
          onClose={() => setDialogOpen(false)}
          onSubmit={async (body) => {
            await api.createTransaction(body)
            await refresh()
          }}
        />
      )}

      {editing && (
        <TransactionDialog
          categories={categories}
          defaultDate={defaultDate}
          transaction={editing}
          onClose={() => setEditing(null)}
          onSubmit={async (body) => {
            await api.updateTransaction(editing.id, body)
            await refresh()
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete transaction?"
          confirmLabel="Delete"
          errorMessage="Could not delete the transaction. Please try again."
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await api.deleteTransaction(deleting.id)
            setDeleting(null)
            await refresh()
          }}
        >
          <strong>{deleting.description}</strong> ·{' '}
          {formatMoneyWithCurrency(deleting.amount, deleting.currency)} on{' '}
          {formatShortDate(deleting.date)} will be removed. This cannot be undone.
        </ConfirmDialog>
      )}
    </div>
  )
}
