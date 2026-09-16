import { Card } from '../../components/Card/Card'
import styles from './PagePlaceholder.module.css'

export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className={styles.wrap}>
      <Card className={styles.card}>
        <p className={styles.title}>{title}</p>
        <p>This page isn't built yet.</p>
      </Card>
    </div>
  )
}
