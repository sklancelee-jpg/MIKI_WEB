import React, { useRef, useEffect } from 'react'
import type { DirEntry } from '../../stores/useDirStore'
import { useDirStore } from '../../stores/useDirStore'
import { FolderIcon } from './shared/Icons'
import { CoverReframe } from './CoverReframe'

interface FolderCardProps {
  entry: DirEntry
  viewMode: 'grid' | 'list'
  isReframing?: boolean
  onReframeStart?: () => void
  onReframeEnd?: () => void
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

const FolderCard: React.FC<FolderCardProps> = ({
  entry,
  viewMode,
  isReframing = false,
  onReframeStart,
  onReframeEnd,
  onClick,
  onContextMenu,
}) => {
  const isCovered = !!entry.coverImage
  const clickTimer = useRef<number | null>(null)
  const setEntryCoverAdjustment = useDirStore((state) => state.setEntryCoverAdjustment)

  useEffect(() => {
    return () => {
      if (clickTimer.current) window.clearTimeout(clickTimer.current)
    }
  }, [])

  if (viewMode === 'list') {
    return (
      <div className="entry-row" onClick={onClick} onContextMenu={onContextMenu} title={entry.name}>
        <span
          className="entry-row__glyph"
          style={{ color: entry.colorHex, width: 18, height: 18, display: 'inline-flex' }}
        >
          <FolderIcon size={18} />
        </span>
        <span className="entry-row__name">{entry.name}</span>
        <span className="entry-row__meta">Folder</span>
      </div>
    )
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isReframing) {
      e.stopPropagation()
      return
    }

    if (!isCovered) {
      onClick()
      return
    }

    e.stopPropagation()
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current)
      clickTimer.current = null
      onReframeStart?.()
    } else {
      clickTimer.current = window.setTimeout(() => {
        onClick()
        clickTimer.current = null
      }, 220)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isReframing) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    onContextMenu(e)
  }

  return (
    <div
      className="folder-card"
      style={{ ['--tile-color' as string]: entry.colorHex, position: 'relative' } as React.CSSProperties}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={isReframing ? undefined : entry.name}
    >
      <div className={`folder-card__icon${isCovered ? ' folder-card__icon--covered' : ''}`} style={{ position: 'relative' }}>
        {isCovered ? (
          isReframing ? (
            <CoverReframe
              imageSrc={entry.coverImage!}
              initialZoom={entry.coverZoom}
              initialPanX={entry.coverPanX}
              initialPanY={entry.coverPanY}
              onSave={(zoom, panX, panY) => {
                setEntryCoverAdjustment(entry.id, zoom, panX, panY)
                onReframeEnd?.()
              }}
              onCancel={() => onReframeEnd?.()}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', zIndex: 1 }}>
              <img
                src={entry.coverImage!}
                className="folder-card__cover"
                alt={entry.name}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  right: 'auto',
                  bottom: 'auto',
                  minWidth: '100%',
                  minHeight: '100%',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  width: 'auto',
                  height: 'auto',
                  transform: `translate(calc(-50% + ${entry.coverPanX || 0}px), calc(-50% + ${entry.coverPanY || 0}px)) scale(${entry.coverZoom || 1})`,
                  transformOrigin: 'center center',
                }}
              />
            </div>
          )
        ) : (
          <span className="folder-card__glyph">
            <FolderIcon size={30} />
          </span>
        )}
      </div>
      <span className="folder-card__name">{entry.name}</span>
    </div>
  )
}

export default React.memo(FolderCard)
