import React, { useRef, useEffect } from 'react'
import type { DirEntry } from '../../stores/useDirStore'
import { useDirStore } from '../../stores/useDirStore'
import { PageIcon } from './shared/Icons'
import { CoverReframe } from './CoverReframe'

interface PageCardProps {
  entry: DirEntry
  viewMode: 'grid' | 'list'
  isReframing?: boolean
  onReframeStart?: () => void
  onReframeEnd?: () => void
  /** Wiki's colorHex, used for the accent title stripe. */
  wikiColor?: string
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

const Line: React.FC<{ w: string }> = ({ w }) => (
  <div style={{ width: w, height: 3, borderRadius: 2, background: '#ddd9d1', marginBottom: 5 }} />
)

const PageCard: React.FC<PageCardProps> = ({
  entry,
  viewMode,
  isReframing = false,
  onReframeStart,
  onReframeEnd,
  wikiColor = '#6366f1',
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
          style={{ color: wikiColor, width: 18, height: 18, display: 'inline-flex' }}
        >
          <PageIcon size={18} />
        </span>
        <span className="entry-row__name">{entry.name}</span>
        <span className="entry-row__meta">Page</span>
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
      className="page-card"
      style={{ position: 'relative' }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={isReframing ? undefined : entry.name}
    >
      <div className="page-card__sheet" style={{ position: 'relative' }}>
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
            <>
              <img
                src={entry.coverImage!}
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
                  zIndex: 0,
                }}
                alt={entry.name}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(158deg, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 40%)',
                pointerEvents: 'none',
                zIndex: 1,
              }} />
            </>
          )
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '100%', padding: '11px 12px', overflow: 'hidden' }}>
            {/* Accent title bar */}
            <div style={{ width: '56%', height: 7, borderRadius: 3, background: wikiColor, marginBottom: 8 }} />
            <Line w="100%" />
            <Line w="90%" />
            <Line w="96%" />
            <Line w="70%" />
            {/* Gloss */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(158deg, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 30%)',
              pointerEvents: 'none',
            }} />
          </div>
        )}
      </div>
      <span className="page-card__name wiki-card__name">{entry.name}</span>
    </div>
  )
}

export default React.memo(PageCard)
