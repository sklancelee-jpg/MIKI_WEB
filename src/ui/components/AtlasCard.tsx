import React, { useRef, useEffect } from 'react'
import type { DirEntry } from '../../stores/useDirStore'
import { useDirStore } from '../../stores/useDirStore'
import { AtlasIcon, CompassRoseIcon } from './shared/Icons'
import { CoverReframe } from './CoverReframe'

interface AtlasCardProps {
  entry: DirEntry
  viewMode: 'grid' | 'list'
  isReframing?: boolean
  onReframeStart?: () => void
  onReframeEnd?: () => void
  wikiColor?: string
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

const AtlasCard: React.FC<AtlasCardProps> = ({
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
          <AtlasIcon size={18} />
        </span>
        <span className="entry-row__name">{entry.name}</span>
        <span className="entry-row__meta">Atlas</span>
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
      {/* Premium blueprint map design sheet */}
      <div className="page-card__sheet" style={{
        background: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
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
          )
        ) : (
          <>
            {/* Blueprint Grid Lines */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '12px 12px',
              pointerEvents: 'none',
              zIndex: 1,
            }} />

            {/* Compass Rose / Map Symbol */}
            <div style={{
              color: wikiColor,
              opacity: 0.65,
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
              zIndex: 2,
            }}>
              <CompassRoseIcon />
            </div>
          </>
        )}

        {/* Accent Color Band */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: wikiColor,
          zIndex: 3,
        }} />

        {/* Glass reflection */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 50%)',
          pointerEvents: 'none',
          zIndex: 4,
        }} />
      </div>
      <span className="page-card__name wiki-card__name">{entry.name}</span>
    </div>
  )
}

export default React.memo(AtlasCard)
