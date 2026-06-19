import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MinusIcon, PlusIcon, CheckIcon, CloseIcon } from './shared/Icons'

interface CoverReframeProps {
  imageSrc: string
  initialZoom?: number
  initialPanX?: number
  initialPanY?: number
  onSave: (zoom: number, panX: number, panY: number) => void
  onCancel: () => void
}

export const CoverReframe: React.FC<CoverReframeProps> = ({
  imageSrc,
  initialZoom = 1,
  initialPanX = 0,
  initialPanY = 0,
  onSave,
  onCancel,
}) => {
  const [zoom, setZoom] = useState(initialZoom)
  const [panX, setPanX] = useState(initialPanX)
  const [panY, setPanY] = useState(initialPanY)

  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [portalTarget, setPortalTarget] = useState<Element | null>(null)

  useEffect(() => {
    if (containerRef.current) {
      const target = containerRef.current.closest('.wiki-card, .folder-card, .page-card')
      if (target) {
        setPortalTarget(target)
      }
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDragging.current = true
    dragStart.current = { x: e.clientX - panX, y: e.clientY - panY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    e.preventDefault()
    e.stopPropagation()
    setPanX(e.clientX - dragStart.current.x)
    setPanY(e.clientY - dragStart.current.y)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging.current) {
      e.preventDefault()
      e.stopPropagation()
      isDragging.current = false
    }
  }

  const handleMouseLeave = () => {
    if (isDragging.current) {
      isDragging.current = false
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const zoomFactor = 0.05
    const delta = e.deltaY < 0 ? zoomFactor : -zoomFactor
    const nextZoom = Math.min(3, Math.max(1, zoom + delta))
    setZoom(parseFloat(nextZoom.toFixed(2)))
  }

  const controlsMarkup = (
    <div
      className="reframe-controls"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      style={{
        position: 'absolute',
        bottom: '6px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '24px',
        padding: '4px 8px',
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.4)',
        zIndex: 200,
        whiteSpace: 'nowrap',
      }}
    >
      {/* Zoom Out Button */}
      <button
        type="button"
        onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.7)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
        }}
        title="Zoom Out"
      >
        <MinusIcon size={12} />
      </button>

      {/* Zoom Slider */}
      <input
        type="range"
        min="1"
        max="3"
        step="0.01"
        value={zoom}
        onChange={(e) => setZoom(parseFloat(e.target.value))}
        style={{
          width: '50px',
          accentColor: 'var(--tile-color, var(--color-accent))',
          cursor: 'pointer',
          margin: 0,
          padding: 0,
        }}
      />

      {/* Zoom In Button */}
      <button
        type="button"
        onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.7)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
        }}
        title="Zoom In"
      >
        <PlusIcon size={12} />
      </button>

      {/* Divider */}
      <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.15)' }} />

      {/* Save Button */}
      <button
        type="button"
        onClick={() => onSave(zoom, panX, panY)}
        style={{
          background: 'none',
          border: 'none',
          color: '#10b981',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '3px',
        }}
        title="Done"
      >
        <CheckIcon size={14} />
      </button>

      {/* Cancel Button */}
      <button
        type="button"
        onClick={onCancel}
        style={{
          background: 'none',
          border: 'none',
          color: '#ef4444',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '3px',
        }}
        title="Cancel"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  )

  return (
    <>
      {/* Overflow wrapper clipping the scaled/translated image */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          borderRadius: 'inherit',
          cursor: 'move',
          zIndex: 10,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        <img
          src={imageSrc}
          alt="Reframe target"
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
            transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${zoom})`,
            transformOrigin: 'center center',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
        {/* Semi-transparent grid overlay to indicate framing mode */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '2px dashed rgba(255, 255, 255, 0.4)',
            borderRadius: 'inherit',
            pointerEvents: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {portalTarget && createPortal(controlsMarkup, portalTarget)}
    </>
  )
}
