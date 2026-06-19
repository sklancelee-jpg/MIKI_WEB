/**
 * WikiLinkMenu — popup suggestion dropdown for page links.
 * Renders file/folder results under double brackets.
 */

import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react'

export interface WikiLinkItem {
  id: string
  name: string
  kind: 'page' | 'folder'
  path: string
}

interface WikiLinkMenuProps {
  items:       WikiLinkItem[]
  command:     (item: WikiLinkItem) => void
  clientRect?: (() => DOMRect | null) | null
}

export interface WikiLinkMenuHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

import { FolderIcon, PageIcon } from '../shared/Icons'

const KindIcon: React.FC<{ kind: 'page' | 'folder'; size?: number }> = ({ kind, size = 15 }) => {
  if (kind === 'folder') return <FolderIcon size={size} />
  if (kind === 'page') return <PageIcon size={size} />
  return null
}

const WikiLinkMenu = forwardRef<WikiLinkMenuHandle, WikiLinkMenuProps>((props, ref) => {
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

  return (
    <div className="slash-menu wiki-link-menu" style={style}>
      <div className="wiki-link-menu__header">Link to Page or Folder</div>
      {props.items.map((item, index) => (
        <button
          key={item.id}
          className={`slash-menu__item${index === selectedIndex ? ' slash-menu__item--active' : ''}`}
          onMouseEnter={() => setSelectedIndex(index)}
          onClick={() => selectItem(index)}
        >
          <span className="slash-menu__icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><KindIcon kind={item.kind} /></span>
          <span className="slash-menu__info">
            <span className="slash-menu__title">{item.name}</span>
            {item.path && <span className="slash-menu__desc">{item.path}</span>}
          </span>
        </button>
      ))}
    </div>
  )
})

WikiLinkMenu.displayName = 'WikiLinkMenu'
export default WikiLinkMenu
