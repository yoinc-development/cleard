import type { InputHTMLAttributes } from 'react'
import { SearchIcon } from '../icons/icons'
import styles from './SearchInput.module.css'

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export function SearchInput({ className, ...rest }: SearchInputProps) {
  const classes = className ? `${styles.wrap} ${className}` : styles.wrap
  return (
    <label className={classes}>
      <SearchIcon className={styles.icon} width={16} height={16} />
      <input type="search" className={styles.input} {...rest} />
    </label>
  )
}
