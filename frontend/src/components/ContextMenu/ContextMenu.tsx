import {useEffect, useLayoutEffect, useRef, useState} from 'react'
import type {KeyboardEvent as ReactKeyboardEvent} from 'react'
import {createPortal} from 'react-dom'
import styles from './ContextMenu.module.css'

const EDGE_MARGIN = 8

export interface ContextMenuItem {
    label: string
    onSelect: () => void
    disabled?: boolean
}

export interface ContextMenuProps {
    x: number
    y: number
    items: ContextMenuItem[]
    onClose: () => void
    label: string
}

export function ContextMenu({x, y, items, onClose, label}: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState({left: x, top: y})

    useLayoutEffect(() => {
        const menu = menuRef.current
        if (!menu) return
        const {width, height} = menu.getBoundingClientRect()
        setPosition({
            left: Math.max(EDGE_MARGIN, Math.min(x, window.innerWidth - width - EDGE_MARGIN)),
            top: Math.max(EDGE_MARGIN, Math.min(y, window.innerHeight - height - EDGE_MARGIN)),
        })
    }, [x, y])

    useEffect(() => {
        menuRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus()
    }, [])

    useEffect(() => {
        function handlePointerDown(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        document.addEventListener('mousedown', handlePointerDown)
        window.addEventListener('blur', onClose)
        window.addEventListener('resize', onClose)
        window.addEventListener('scroll', onClose, true)
        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            window.removeEventListener('blur', onClose)
            window.removeEventListener('resize', onClose)
            window.removeEventListener('scroll', onClose, true)
        }
    }, [onClose])

    function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
        if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
            return
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

        event.preventDefault()
        const buttons = Array.from(
            menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [],
        )
        if (buttons.length === 0) return
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
        const step = event.key === 'ArrowDown' ? 1 : -1
        const next = (current + step + buttons.length) % buttons.length
        buttons[next].focus()
    }

    return createPortal(
        <div
            ref={menuRef}
            className={styles.menu}
            style={{left: position.left, top: position.top}}
            role="menu"
            aria-label={label}
            onKeyDown={handleKeyDown}
            onContextMenu={(event) => event.preventDefault()}
        >
            {items.map((item) => (
                <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    className={styles.item}
                    disabled={item.disabled}
                    onClick={() => {
                        item.onSelect()
                        onClose()
                    }}
                >
                    {item.label}
                </button>
            ))}
        </div>,
        document.body,
    )
}
