import { resolveCategoryColour } from '../../lib/colour'
import styles from './CategoryLabel.module.css'

export function CategoryDot({ colour }: { colour: string }) {
  return <span className={styles.dot} style={{ background: resolveCategoryColour(colour) }} />
}

export function CategoryLabel({ name, colour }: { name: string; colour: string }) {
  return (
    <span className={styles.label}>
      <CategoryDot colour={colour} />
      {name}
    </span>
  )
}
