import { useEffect, useState } from 'react'
import { useApi } from '../../api/ApiContext'
import type { Category, CategoryDraft } from '../../api/types'
import { Button } from '../../components/Button/Button'
import { Card } from '../../components/Card/Card'
import { MonthNav } from '../../components/MonthNav/MonthNav'
import { PageHeader } from '../../components/PageHeader/PageHeader'
import { PlusIcon } from '../../components/icons/icons'
import { formatMonthLabel } from '../../lib/format'
import { useMonth } from '../../state/MonthContext'
import { CategoryEditor } from './CategoryEditor'
import { CategoryTable } from './CategoryTable'
import styles from './CategoriesPage.module.css'

type Selection = { mode: 'none' } | { mode: 'edit'; id: string } | { mode: 'create' }

export function CategoriesPage() {
  const api = useApi()
  const { selected } = useMonth()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selection, setSelection] = useState<Selection>({ mode: 'none' })

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setLoadError(null)
    setSelection({ mode: 'none' })
    api.listCategories(selected.key).then(
      (result) => {
        if (ignore) return
        setCategories(result)
        setLoading(false)
      },
      () => {
        if (ignore) return
        setCategories([])
        setLoading(false)
        setLoadError('Could not load categories.')
      },
    )
    return () => {
      ignore = true
    }
  }, [api, selected.key])

  async function refresh(): Promise<Category[]> {
    const result = await api.listCategories(selected.key)
    setCategories(result)
    return result
  }

  async function handleCreate(body: CategoryDraft) {
    const created = await api.createCategory(body)
    await refresh()
    setSelection({ mode: 'edit', id: created.id })
  }

  async function handleUpdate(id: string, body: CategoryDraft) {
    await api.updateCategory(id, body)
    await refresh()
    setSelection({ mode: 'edit', id })
  }

  const selectedCategory = selection.mode === 'edit' ? (categories.find((c) => c.id === selection.id) ?? null) : null

  return (
    <div className={styles.page}>
      <PageHeader
        left={<h1 className={styles.title}>Categories</h1>}
        meta={`Figures shown for ${formatMonthLabel(selected.year, selected.month)}`}
        actions={
          <>
            <MonthNav variant="compact" />
            <Button variant="primary" onClick={() => setSelection({ mode: 'create' })}>
              <PlusIcon width={16} height={16} />
              New category
            </Button>
          </>
        }
      />

      {loadError ? (
        <Card className={styles.error}>{loadError}</Card>
      ) : (
        <div className={styles.body}>
          <CategoryTable
            categories={categories}
            selectedId={selection.mode === 'edit' ? selection.id : null}
            onSelect={(id) => setSelection({ mode: 'edit', id })}
          />

          {selection.mode === 'none' && !loading && (
            <Card className={styles.placeholder}>Select a category to edit, or add a new one.</Card>
          )}

          {selection.mode === 'edit' && selectedCategory && (
            <CategoryEditor
              key={selectedCategory.id}
              category={selectedCategory}
              onCancel={() => setSelection({ mode: 'none' })}
              onSubmit={(body) => handleUpdate(selectedCategory.id, body)}
            />
          )}

          {selection.mode === 'create' && (
            <CategoryEditor
              key="new"
              category={null}
              onCancel={() => setSelection({ mode: 'none' })}
              onSubmit={handleCreate}
            />
          )}
        </div>
      )}
    </div>
  )
}
