import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

export interface PageHeaderProps {
  left: ReactNode
  meta?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ left, meta, actions }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {left}
        {meta && <span className={styles.meta}>{meta}</span>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
