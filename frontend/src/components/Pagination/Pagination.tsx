import {useTranslation} from 'react-i18next'
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
    const {t} = useTranslation()
    if (total <= pageSize) return null

    const rangeStart = offset + 1
    const rangeEnd = Math.min(offset + pageSize, total)

    return (
        <div className={styles.pagination}>
      <span className={styles.range}>
        {t('pagination.range', {start: rangeStart, end: rangeEnd, total})}
      </span>
            <button
                type="button"
                className={styles.arrow}
                onClick={onPrevious}
                disabled={offset === 0}
                aria-label={t('pagination.previous')}
            >
                <ChevronLeftIcon width={16} height={16}/>
            </button>
            <button
                type="button"
                className={styles.arrow}
                onClick={onNext}
                disabled={offset + pageSize >= total}
                aria-label={t('pagination.next')}
            >
                <ChevronRightIcon width={16} height={16}/>
            </button>
        </div>
    )
}
