/**
 * ContextMenu — right-click menu for folder/page cards.
 * Positioned absolutely at the mouse cursor.
 * Actions: Rename, Delete, Change Color (folders only), Move (stub).
 */

import React, { useEffect, useRef } from 'react'
import type { EntryKind } from '../../stores/useDirStore'

export interface ContextMenuState {
  x: number
  y: number
  entryId: string
  entryKind: EntryKind
  entryName: string
  hasCover?: boolean
}

interface ContextMenuProps {
  state: ContextMenuState
  onRename: (id: string) => void
  onDelete: (id: string) => void
  onChangeColor?: (id: string) => void
  onChangeCover?: (id: string) => void
  onAdjustCover?: (id: string) => void
  onRemoveCover?: (id: string) => void
  onClose: () => void
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  state,
  onRename,
  onDelete,
  onChangeColor,
  onChangeCover,
  onAdjustCover,
  onRemoveCover,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  // Clamp menu to stay inside viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(state.y, window.innerHeight - 200),
    left: Math.min(state.x, window.innerWidth - 180),
    zIndex: 300,
  }

  return (
    <div ref={ref} className="context-menu" style={style}>
      <button
        className="context-menu__item"
        onClick={() => { onRename(state.entryId); onClose() }}
      >
        Rename
      </button>
      {onChangeColor && ((state.entryKind as string) === 'folder' || (state.entryKind as string) === 'wiki') && (
        <button
          className="context-menu__item"
          onClick={() => { onChangeColor(state.entryId); onClose() }}
        >
          Change Color
        </button>
      )}
      {onChangeCover && (
        <>
          <button
            className="context-menu__item"
            onClick={() => { onChangeCover(state.entryId); onClose() }}
          >
            Change Cover
          </button>
          {state.hasCover && onAdjustCover && (
            <button
              className="context-menu__item"
              onClick={() => { onAdjustCover?.(state.entryId); onClose() }}
            >
              Adjust cover
            </button>
          )}
          {state.hasCover && onRemoveCover && (
            <button
              className="context-menu__item"
              onClick={() => { onRemoveCover?.(state.entryId); onClose() }}
            >
              Remove Cover
            </button>
          )}
        </>
      )}
      <button
        className="context-menu__item context-menu__item--disabled"
        disabled
      >
        Move
      </button>
      <div className="context-menu__divider" />
      <button
        className="context-menu__item context-menu__item--danger"
        onClick={() => { onDelete(state.entryId); onClose() }}
      >
        Delete
      </button>
    </div>
  )
}

export default ContextMenu
