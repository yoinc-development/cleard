import { resolveCategoryColor } from '../../lib/color'
import styles from './CategoryLabel.module.css'

export function CategoryDot({ color }: { color: string }) {
  return <span className={styles.dot} style={{ background: resolveCategoryColor(color) }} />
}

export function CategoryLabel({ name, color }: { name: string; color: string }) {
  return (
    <span className={styles.label}>
      <CategoryDot color={color} />
      {name}
    </span>
  )
}
