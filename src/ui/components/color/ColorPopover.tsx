/**
 * ColorPopover — positioned floating popover wrapping ColorWheelPicker.
 * Appears near the right-click point; Apply commits the color, Cancel reverts.
 * Keeps FULL_PALETTE export so CreateWikiModal's import still works.
 */

import React, { useState, useEffect, useRef } from 'react'
import ColorWheelPicker from './ColorWheelPicker'

export const FULL_PALETTE = [
  // Reds / Roses
  '#ef4444','#f43f5e','#e11d48','#fb7185','#ec4899','#db2777','#be185d','#f9a8d4',
  // Oranges / Ambers
  '#f97316','#ea580c','#fb923c','#fbbf24','#f59e0b','#d97706','#eab308','#fde047',
  // Greens / Teals
  '#22c55e','#16a34a','#4ade80','#14b8a6','#0d9488','#2dd4bf','#06b6d4','#22d3ee',
  // Blues / Indigo
  '#38bdf8','#0ea5e9','#3b82f6','#2563eb','#6366f1','#4f46e5','#818cf8','#60a5fa',
  // Purples / Neutrals
  '#8b5cf6','#a855f7','#c084fc','#d946ef','#e879f9','#94a3b8','#64748b','#cbd5e1',
]

interface Props {
  x: number
  y: number
  currentColor: string
  onPreview?: (color: string) => void   // live update while dragging
  onConfirm: (color: string) => void
  onCancel: () => void
}

const ColorPickerModal: React.FC<Props> = ({ x, y, currentColor, onPreview, onConfirm, onCancel }) => {
  const [picked, setPicked] = useState(currentColor)

  const handleChange = (color: string) => {
    setPicked(color)
    onPreview?.(color)
  }
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click (50ms delay avoids the triggering mousedown)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel()
    }
    const id = window.setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => { window.clearTimeout(id); document.removeEventListener('mousedown', handler) }
  }, [onCancel])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm(picked)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel, onConfirm, picked])

  // Clamp to viewport
  const W = 250, H = 310
  const left = Math.min(Math.max(x, 8), window.innerWidth  - W - 8)
  const top  = Math.min(Math.max(y, 8), window.innerHeight - H - 8)

  return (
    <div ref={ref} className="color-swatch-popover" style={{ left, top, width: W }}>
      <ColorWheelPicker value={picked} onChange={handleChange} />
      <div className="cwp__actions">
        <button className="btn--ghost cwp__cancel" onClick={onCancel}>Cancel</button>
        <button className="btn--primary cwp__apply" onClick={() => onConfirm(picked)}>Apply</button>
      </div>
    </div>
  )
}

export default ColorPickerModal
