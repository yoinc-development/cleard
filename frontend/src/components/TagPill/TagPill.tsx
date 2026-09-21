import { CloseIcon } from '../icons/icons'
import styles from './TagPill.module.css'

export interface TagPillProps {
  name: string
  count?: number
  onRemove?: () => void
}

export function TagPill({ name, count, onRemove }: TagPillProps) {
  return (
    <span className={styles.pill}>
      {name}
      {count !== undefined && <span className={styles.count}>· {count}</span>}
      {onRemove && (
        <button
          type="button"
          className={styles.remove}
          onClick={onRemove}
          aria-label={`Remove ${name} tag`}
        >
          <CloseIcon width={12} height={12} />
        </button>
      )}
    </span>
  )
}
