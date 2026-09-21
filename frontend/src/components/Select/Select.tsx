import { useEffect, useRef, useState } from 'react'
import { resolveCategoryColor } from '../../lib/color'
import { ChevronDownIcon } from '../icons/icons'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
  color?: string
  meta?: string
}

export interface SelectProps {
  options: SelectOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  id?: string
}

export function Select({ options, value, onChange, placeholder = 'Select…', id }: SelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value) ?? null

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
      <button
        type="button"
        id={id}
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
      >
        <span className={styles.triggerLabel}>
          {selected?.color && (
            <span className={styles.dot} style={{ background: resolveCategoryColor(selected.color) }} />
          )}
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon className={styles.chevron} width={16} height={16} />
      </button>
      {open && (
        <ul className={styles.listbox} role="listbox">
          {options.map((option) => {
            const isActive = option.value === value
            const classes = isActive ? `${styles.option} ${styles.optionActive}` : styles.option
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={classes}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <span className={styles.triggerLabel}>
                    {option.color && (
                      <span
                        className={styles.dot}
                        style={{ background: resolveCategoryColor(option.color) }}
                      />
                    )}
                    {option.label}
                  </span>
                  {option.meta && <span className={styles.optionMeta}>{option.meta}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
