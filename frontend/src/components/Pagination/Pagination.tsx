import {ChevronLeftIcon, ChevronRightIcon} from '../icons/icons'
import styles from './Pagination.module.css'

export interface PaginationProps {
    offset: number
    pageSize: number
    total: number
    onPrevious: () => void
    onNext: () => void
}

export function Pagination({offset, pageSize, total, onPrevious, onNext}: PaginationProps) {
    if (total <= pageSize) return null

    const rangeStart = offset + 1
    const rangeEnd = Math.min(offset + pageSize, total)

    return (
        <div className={styles.pagination}>
      <span className={styles.range}>
        {rangeStart}–{rangeEnd} of {total}
      </span>
            <button
                type="button"
                className={styles.arrow}
                onClick={onPrevious}
                disabled={offset === 0}
                aria-label="Previous page"
            >
                <ChevronLeftIcon width={16} height={16}/>
            </button>
            <button
                type="button"
                className={styles.arrow}
                onClick={onNext}
                disabled={offset + pageSize >= total}
                aria-label="Next page"
            >
                <ChevronRightIcon width={16} height={16}/>
            </button>
        </div>
    )
}
