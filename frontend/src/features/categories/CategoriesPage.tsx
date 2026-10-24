import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useApi} from '../../api/ApiContext'
import type {Category, CategoryReassignment, Transaction} from '../../api/types'
import {Button} from '../../components/Button/Button'
import {Card} from '../../components/Card/Card'
import {ConfirmDialog} from '../../components/ConfirmDialog/ConfirmDialog'
import {MonthNav} from '../../components/MonthNav/MonthNav'
import {PageHeader} from '../../components/PageHeader/PageHeader'
import {PlusIcon} from '../../components/icons/icons'
import {SafeTrans} from '../../i18n/SafeTrans'
import {formatMonthLabel} from '../../lib/format'
import {useAccount} from '../../state/AccountContext'
import {useMonth} from '../../state/MonthContext'
import {CategoryEditor} from './CategoryEditor'
import type {CategoryFormValues} from './CategoryEditor'
import {CategoryReassignDialog} from './CategoryReassignDialog'
import {CategoryTable} from './CategoryTable'
import styles from './CategoriesPage.module.css'

type Selection = { mode: 'none' } | { mode: 'edit'; id: string } | { mode: 'create' }

export function CategoriesPage() {
    const {t} = useTranslation()
    const api = useApi()
    const {selected} = useMonth()
    const {activeAccount} = useAccount()

    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [loadFailed, setLoadFailed] = useState(false)
    const [selection, setSelection] = useState<Selection>({mode: 'none'})
    const [deleting, setDeleting] = useState<{ category: Category; transactions: Transaction[] } | null>(null)

    useEffect(() => {
        let ignore = false
        setLoading(true)
        setLoadFailed(false)
        setSelection({mode: 'none'})
        api.listCategories(selected.key, activeAccount.id).then(
            (result) => {
                if (ignore) return
                setCategories(result)
                setLoading(false)
            },
            () => {
                if (ignore) return
                setCategories([])
                setLoading(false)
                setLoadFailed(true)
            },
        )
        return () => {
            ignore = true
        }
    }, [api, selected.key, activeAccount.id])

    async function refresh(): Promise<Category[]> {
        const result = await api.listCategories(selected.key, activeAccount.id)
        setCategories(result)
        return result
    }

    async function handleCreate(body: CategoryFormValues) {
        const created = await api.createCategory({...body, accountId: activeAccount.id})
        await refresh()
        setSelection({mode: 'edit', id: created.id})
    }

    async function handleUpdate(category: Category, body: CategoryFormValues) {
        const id = category.id
        await api.updateCategory(id, {
            ...body,
            accountId: category.accountId,
            targetAccountId: category.targetAccountId
        })
        await refresh()
        setSelection({mode: 'edit', id})
    }

    async function handleDeleteRequest(category: Category) {
        const transactions = await api.listCategoryTransactions(category.id)
        setDeleting({category, transactions})
    }

    async function handleDeleteConfirm(category: Category, reassignments: CategoryReassignment[]) {
        await api.deleteCategory(category.id, reassignments)
        setDeleting(null)
        setSelection({mode: 'none'})
        setCategories((prev) => prev.filter((c) => c.id !== category.id))
        try {
            await refresh()
        } catch {
        }
    }

    const selectedCategory = selection.mode === 'edit' ? (categories.find((c) => c.id === selection.id) ?? null) : null

    return (
        <div className={styles.page}>
            <PageHeader
                left={<h1 className={styles.title}>{t('categories.title')}</h1>}
                meta={t('categories.figures_for', {month: formatMonthLabel(selected.year, selected.month)})}
                actions={
                    <>
                        <MonthNav variant="compact"/>
                        <Button variant="primary" onClick={() => setSelection({mode: 'create'})}>
                            <PlusIcon width={16} height={16}/>
                            {t('categories.new')}
                        </Button>
                    </>
                }
            />

            {loadFailed ? (
                <Card className={styles.error}>{t('categories.load_error')}</Card>
            ) : (
                <div className={styles.body}>
                    <CategoryTable
                        categories={categories}
                        selectedId={selection.mode === 'edit' ? selection.id : null}
                        onSelect={(id) => setSelection({mode: 'edit', id})}
                    />

                    {selection.mode === 'none' && !loading && (
                        <Card className={styles.placeholder}>{t('categories.select_hint')}</Card>
                    )}

                    {selection.mode === 'edit' && selectedCategory && (
                        <CategoryEditor
                            key={selectedCategory.id}
                            category={selectedCategory}
                            onCancel={() => setSelection({mode: 'none'})}
                            onSubmit={(body) => handleUpdate(selectedCategory, body)}
                            onDelete={() => handleDeleteRequest(selectedCategory)}
                        />
                    )}

                    {selection.mode === 'create' && (
                        <CategoryEditor
                            key="new"
                            category={null}
                            onCancel={() => setSelection({mode: 'none'})}
                            onSubmit={handleCreate}
                        />
                    )}
                </div>
            )}

            {deleting && deleting.transactions.length === 0 && (
                <ConfirmDialog
                    title={t('categories.delete.title')}
                    confirmLabel={t('common.delete')}
                    errorMessage={t('categories.delete.error')}
                    onCancel={() => setDeleting(null)}
                    onConfirm={() => handleDeleteConfirm(deleting.category, [])}
                >
                    <SafeTrans
                        i18nKey="categories.delete.body"
                        values={{name: deleting.category.name}}
                        components={{strong: <strong/>}}
                    />
                </ConfirmDialog>
            )}

            {deleting && deleting.transactions.length > 0 && (
                <CategoryReassignDialog
                    category={deleting.category}
                    transactions={deleting.transactions}
                    categories={categories}
                    onCancel={() => setDeleting(null)}
                    onConfirm={(reassignments) => handleDeleteConfirm(deleting.category, reassignments)}
                />
            )}
        </div>
    )
}
