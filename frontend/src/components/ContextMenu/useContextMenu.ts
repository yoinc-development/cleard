import { useCallback, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

export interface ContextMenuState<T> {
  x: number
  y: number
  target: T
}

export function useContextMenu<T>() {
  const [state, setState] = useState<ContextMenuState<T> | null>(null)

  const open = useCallback((event: ReactMouseEvent, target: T) => {
    event.preventDefault()
    event.stopPropagation()
    setState({ x: event.clientX, y: event.clientY, target })
  }, [])

  const close = useCallback(() => setState(null), [])

  return { state, open, close }
}
