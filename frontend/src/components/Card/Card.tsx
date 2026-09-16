import type { HTMLAttributes } from 'react'
import styles from './Card.module.css'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const classes = className ? `${styles.card} ${className}` : styles.card
  return <div className={classes} {...rest} />
}
