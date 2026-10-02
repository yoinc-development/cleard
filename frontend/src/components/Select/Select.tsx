import {useEffect, useRef, useState} from 'react'
import type {CSSProperties} from 'react'
import {resolveCategoryColor} from '../../lib/color'
import {ChevronDownIcon} from '../icons/icons'
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

const LISTBOX_MAX_HEIGHT = 260
const LISTBOX_GAP = 8

export function Select({options, value, onChange, placeholder = 'Select…', id}: SelectProps) {
    const [open, setOpen] = useState(false)
    const [listboxStyle, setListboxStyle] = useState<CSSProperties>({})
    const rootRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const selected = options.find((o) => o.value === value) ?? null

    function toggle() {
        if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            const below = window.innerHeight - rect.bottom - LISTBOX_GAP * 2
            const above = rect.top - LISTBOX_GAP * 2
            const openAbove = below < LISTBOX_MAX_HEIGHT && above > below
            const maxHeight = Math.min(LISTBOX_MAX_HEIGHT, openAbove ? above : below)
            setListboxStyle({
                left: rect.left,
                width: rect.width,
                maxHeight,
                ...(openAbove
                    ? {bottom: window.innerHeight - rect.top + LISTBOX_GAP}
                    : {top: rect.bottom + LISTBOX_GAP}),
            })
        }
        setOpen((o) => !o)
    }

    useEffect(() => {
        if (!open) return

        function handlePointerDown(event: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        function close() {
            setOpen(false)
        }

        // The listbox is position: fixed, so it would drift from the trigger on scroll/resize.
        function handleScroll(event: Event) {
            const listbox = rootRef.current?.querySelector('[role="listbox"]')
            if (listbox && event.target instanceof Node && listbox.contains(event.target)) return
            close()
        }

        document.addEventListener('mousedown', handlePointerDown)
        window.addEventListener('scroll', handleScroll, true)
        window.addEventListener('resize', close)
        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            window.removeEventListener('scroll', handleScroll, true)
            window.removeEventListener('resize', close)
        }
    }, [open])

    return (
        <div className={styles.root} ref={rootRef}>
            <button
                type="button"
                id={id}
                ref={triggerRef}
                className={styles.trigger}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={toggle}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') setOpen(false)
                }}
            >
        <span className={styles.triggerLabel}>
          {selected?.color && (
              <span className={styles.dot} style={{background: resolveCategoryColor(selected.color)}}/>
          )}
            {selected ? selected.label : placeholder}
        </span>
                <ChevronDownIcon className={styles.chevron} width={16} height={16}/>
            </button>
            {open && (
                <ul className={styles.listbox} role="listbox" style={listboxStyle}>
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
                            style={{background: resolveCategoryColor(option.color)}}
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
