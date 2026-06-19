/**
 * SlashMenu — popup rendered by the slash command extension.
 * Shows icon + title + description. Items are grouped with section headers.
 * Mounted via Tiptap's ReactRenderer outside the main React tree.
 */

import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react'
import type { SlashItem } from './slashItems'

interface SlashMenuProps {
  items:       SlashItem[]
  command:     (item: SlashItem) => void
  clientRect?: (() => DOMRect | null) | null
}

export interface SlashMenuHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => setSelectedIndex(0), [props.items])

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) props.command(item)
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i + props.items.length - 1) % props.items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % props.items.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  const rect = props.clientRect?.()
  const style: React.CSSProperties = rect
    ? { position: 'fixed', top: rect.bottom + 6, left: rect.left, zIndex: 1000 }
    : { position: 'fixed', top: -9999, left: -9999 }

  if (!props.items.length) return null

  // Render with group section headers
  let lastGroup = ''

  return (
    <div className="slash-menu" style={style}>
      {props.items.map((item, index) => {
        const showGroupHeader = item.group !== lastGroup
        lastGroup = item.group
        return (
          <React.Fragment key={item.title}>
            {showGroupHeader && (
              <div className="slash-menu__group">{item.group}</div>
            )}
            <button
              className={`slash-menu__item${index === selectedIndex ? ' slash-menu__item--active' : ''}`}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => selectItem(index)}
            >
              <span className="slash-menu__icon">{item.icon}</span>
              <span className="slash-menu__info">
                <span className="slash-menu__title">{item.title}</span>
                <span className="slash-menu__desc">{item.description}</span>
              </span>
            </button>
          </React.Fragment>
        )
      })}
    </div>
  )
})

SlashMenu.displayName = 'SlashMenu'
export default SlashMenu
