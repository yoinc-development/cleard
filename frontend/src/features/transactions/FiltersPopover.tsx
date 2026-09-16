import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button/Button'
import { FilterIcon } from '../../components/icons/icons'
import { resolveCategoryColour } from '../../lib/colour'
import type { Category, Tag } from '../../api/types'
import styles from './FiltersPopover.module.css'

export interface FiltersPopoverProps {
  categories: Category[]
  tags: Tag[]
  selectedCategoryIds: string[]
  selectedTags: string[]
  onToggleCategory: (categoryId: string) => void
  onToggleTag: (tag: string) => void
}

export function FiltersPopover({
  categories,
  tags,
  selectedCategoryIds,
  selectedTags,
  onToggleCategory,
  onToggleTag,
}: FiltersPopoverProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const filterTypeCount = (selectedCategoryIds.length > 0 ? 1 : 0) + (selectedTags.length > 0 ? 1 : 0)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  return (
    <div className={styles.root} ref={rootRef}>
      <Button
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <FilterIcon width={16} height={16} />
        Filters
        {filterTypeCount > 0 && <span className={styles.badge}>{filterTypeCount}</span>}
      </Button>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Filter transactions">
          <div className={styles.group}>
            <span className={styles.groupLabel}>Category</span>
            <div className={styles.options}>
              {categories.map((category) => (
                <label className={styles.option} key={category.id}>
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() => onToggleCategory(category.id)}
                  />
                  <span className={styles.dot} style={{ background: resolveCategoryColour(category.colour) }} />
                  <span className={styles.optionName}>{category.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className={styles.group}>
            <span className={styles.groupLabel}>Tag</span>
            <div className={styles.options}>
              {tags.length === 0 && <span className={styles.optionCount}>No tags this month</span>}
              {tags.map((tag) => (
                <label className={styles.option} key={tag.name}>
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.name)}
                    onChange={() => onToggleTag(tag.name)}
                  />
                  <span className={styles.optionName}>{tag.name}</span>
                  <span className={styles.optionCount}>{tag.count}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
