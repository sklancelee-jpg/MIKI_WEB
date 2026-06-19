import React, { useRef, useEffect } from 'react'
import type { Wiki } from '../../stores/useWikiStore'
import { useWikiStore } from '../../stores/useWikiStore'
import { WikiIcon } from './shared/Icons'
import { CoverReframe } from './CoverReframe'

interface WikiCardProps {
  wiki: Wiki
  isReframing?: boolean
  onReframeStart?: () => void
  onReframeEnd?: () => void
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

const WikiCard: React.FC<WikiCardProps> = ({
  wiki,
  isReframing = false,
  onReframeStart,
  onReframeEnd,
  onClick,
  onContextMenu,
}) => {
  const isCovered = !!wiki.coverImage
  const clickTimer = useRef<number | null>(null)
  const setWikiCoverAdjustment = useWikiStore((state) => state.setWikiCoverAdjustment)

  useEffect(() => {
    return () => {
      if (clickTimer.current) window.clearTimeout(clickTimer.current)
    }
  }, [])

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
      className="wiki-card"
      style={{ ['--tile-color' as string]: wiki.colorHex, position: 'relative' } as React.CSSProperties}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={isReframing ? undefined : wiki.name}
    >
      <div className={`wiki-card__icon${isCovered ? ' wiki-card__icon--covered' : ''}`} style={{ position: 'relative' }}>
        {isCovered ? (
          isReframing ? (
            <CoverReframe
              imageSrc={wiki.coverImage!}
              initialZoom={wiki.coverZoom}
              initialPanX={wiki.coverPanX}
              initialPanY={wiki.coverPanY}
              onSave={(zoom, panX, panY) => {
                setWikiCoverAdjustment(wiki.id, zoom, panX, panY)
                onReframeEnd?.()
              }}
              onCancel={() => onReframeEnd?.()}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', zIndex: 1 }}>
              <img
                src={wiki.coverImage!}
                className="wiki-card__cover"
                alt={wiki.name}
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
                  transform: `translate(calc(-50% + ${wiki.coverPanX || 0}px), calc(-50% + ${wiki.coverPanY || 0}px)) scale(${wiki.coverZoom || 1})`,
                  transformOrigin: 'center center',
                }}
              />
            </div>
          )
        ) : (
          <span className="wiki-card__glyph">
            <WikiIcon />
          </span>
        )}
      </div>
      <span className="wiki-card__name">{wiki.name}</span>
    </div>
  )
}

export default React.memo(WikiCard)
