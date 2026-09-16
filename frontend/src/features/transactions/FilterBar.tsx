import { CloseIcon } from '../../components/icons/icons'
import { SearchInput } from '../../components/SearchInput/SearchInput'
import type { Category } from '../../api/types'
import styles from './FilterBar.module.css'

export interface FilterBarProps {
  categories: Category[]
  selectedCategoryIds: string[]
  selectedTags: string[]
  onClearCategories: () => void
  onClearTags: () => void
  onClearAll: () => void
  search: string
  onSearchChange: (value: string) => void
}

export function FilterBar({
  categories,
  selectedCategoryIds,
  selectedTags,
  onClearCategories,
  onClearTags,
  onClearAll,
  search,
  onSearchChange,
}: FilterBarProps) {
  const categoryNames = selectedCategoryIds
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter((name): name is string => Boolean(name))

  const hasFilters = categoryNames.length > 0 || selectedTags.length > 0

  return (
    <div className={styles.bar}>
      <div className={styles.chips}>
        {categoryNames.length > 0 && (
          <span className={styles.chip}>
            Category: {categoryNames.join(', ')}
            <button
              type="button"
              className={styles.chipRemove}
              onClick={onClearCategories}
              aria-label="Clear category filter"
            >
              <CloseIcon width={12} height={12} />
            </button>
          </span>
        )}
        {selectedTags.length > 0 && (
          <span className={styles.chip}>
            Tag: {selectedTags.join(', ')}
            <button
              type="button"
              className={styles.chipRemove}
              onClick={onClearTags}
              aria-label="Clear tag filter"
            >
              <CloseIcon width={12} height={12} />
            </button>
          </span>
        )}
        {hasFilters && (
          <button type="button" className={styles.clear} onClick={onClearAll}>
            Clear
          </button>
        )}
      </div>
      <SearchInput
        className={styles.search}
        placeholder="Search description or tag"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </div>
  )
}
