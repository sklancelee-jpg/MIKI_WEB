/**
 * LeftPanel — Table of Contents panel (collapsible).
 * H1/H2 items with children get a chevron to collapse their subsections.
 */

import React, { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '../shared/Icons'

export interface TocItem {
  id: string
  level: 1 | 2 | 3
  text: string
}

interface LeftPanelProps {
  open: boolean
  tocItems: TocItem[]
  onToggle: () => void
  onHeadingClick: (id: string) => void
}

/** Returns the index of the closest preceding item with a strictly lower level, or -1. */
function getParentIndex(items: TocItem[], index: number): number {
  const level = items[index].level
  for (let i = index - 1; i >= 0; i--) {
    if (items[i].level < level) return i
  }
  return -1
}

/** True if the next item exists and has a higher level (i.e. this item has children). */
function hasChildren(items: TocItem[], index: number): boolean {
  return index + 1 < items.length && items[index + 1].level > items[index].level
}

/** True if no ancestor in the chain is collapsed. */
function isVisible(items: TocItem[], index: number, collapsed: Set<string>): boolean {
  const parentIdx = getParentIndex(items, index)
  if (parentIdx === -1) return true
  if (collapsed.has(items[parentIdx].id)) return false
  return isVisible(items, parentIdx, collapsed)
}

const LeftPanel: React.FC<LeftPanelProps> = ({ open, tocItems, onToggle, onHeadingClick }) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <aside className={`panel panel--left${open ? '' : ' panel--collapsed'}${ready ? ' panel--ready' : ''}`}>
      <button
        className="panel__toggle panel__toggle--left"
        onClick={onToggle}
        aria-label={open ? 'Collapse table of contents' : 'Expand table of contents'}
        title={open ? 'Collapse' : 'Expand'}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {open ? <ChevronLeftIcon size={12} /> : <ChevronRightIcon size={12} />}
      </button>

      <div className="panel__content">
        <h3 className="panel__heading">Contents</h3>
        {tocItems.length === 0 ? (
          <p className="panel__empty">Headings will appear here as you write.</p>
        ) : (
          <nav className="toc">
            {tocItems.map((item, idx) => {
              if (!isVisible(tocItems, idx, collapsed)) return null
              const canCollapse = hasChildren(tocItems, idx)
              const isCollapsed = collapsed.has(item.id)
              return (
                <div key={item.id} className={`toc__row toc__row--h${item.level}`}>
                  {canCollapse && (
                    <button
                      className="toc__chevron"
                      onClick={() => toggleCollapse(item.id)}
                      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {isCollapsed ? <ChevronRightIcon size={10} /> : <ChevronDownIcon size={10} />}
                    </button>
                  )}
                  <button
                    className={`toc__item toc__item--h${item.level}${canCollapse ? '' : ' toc__item--leaf'}`}
                    onClick={() => onHeadingClick(item.id)}
                  >
                    {item.text}
                  </button>
                </div>
              )
            })}
          </nav>
        )}
      </div>
    </aside>
  )
}

export default LeftPanel
