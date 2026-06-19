/**
 * ColorPicker — full-featured color picker with a saveable custom palette.
 *
 * - Custom palette: add the current color; click × to remove
 * - First-use fallback: shows a preset grid until the palette has entries
 * - Hex text input + 🎨 button that immediately opens the OS color wheel
 *
 * The native <input type="color"> is overlaid on the 🎨 emoji so the OS
 * color picker opens at this element's screen position (not the bottom corner).
 *
 * onWheelOpen / onWheelClose are forwarded to ToolbarCenter so the document
 * mousedown handler can suppress closing while the OS Colors panel is open.
 */

import React, { useState } from 'react'
import { usePaletteStore } from '../../../stores/usePaletteStore'

interface ColorPickerProps {
  value:          string
  onChange:       (hex: string) => void
  onClose:        () => void
  onWheelOpen?:   () => void
  onWheelClose?:  () => void
}

const FALLBACK_COLORS = [
  '#111111', '#ffffff', '#f87171', '#fb923c',
  '#facc15', '#4ade80', '#60a5fa', '#a78bfa',
  '#f472b6', '#34d399', '#38bdf8', '#e879f9',
  '#f97316', '#84cc16', '#06b6d4', '#8b5cf6',
]

const ColorPicker: React.FC<ColorPickerProps> = ({
  value, onChange, onClose, onWheelOpen, onWheelClose,
}) => {
  const { colors: palette, addColor, removeColor } = usePaletteStore()
  const [hex, setHex] = useState(value.replace('#', ''))

  const hexValid = /^[0-9a-fA-F]{6}$/.test(hex)

  /** Apply a color and close the picker (swatch clicks + Enter) */
  const apply = (h: string) => {
    const norm = h.startsWith('#') ? h : `#${h}`
    if (/^#[0-9a-fA-F]{6}$/.test(norm)) {
      onChange(norm)
      setHex(norm.replace('#', ''))
      onClose()
    }
  }

  /** Set color WITHOUT closing — native wheel & add-to-palette */
  const pick = (h: string) => {
    const norm = h.startsWith('#') ? h : `#${h}`
    if (/^#[0-9a-fA-F]{6}$/.test(norm)) {
      onChange(norm)
      setHex(norm.replace('#', ''))
    }
  }

  /**
   * When the 🎨 overlay is clicked, the macOS Colors dialog may open.
   * Signal to ToolbarCenter that the wheel is active so its mousedown handler
   * won't close this dropdown. Listen for the window to regain focus (Colors
   * dialog was dismissed) to clear the flag.
   */
  const handleWheelMouseDown = () => {
    onWheelOpen?.()
    const onWindowFocus = () => {
      // Small delay so any pending mousedown on Chrome doesn't close the picker
      setTimeout(() => onWheelClose?.(), 300)
      window.removeEventListener('focus', onWindowFocus)
    }
    window.addEventListener('focus', onWindowFocus)
  }

  const swatches = palette.length > 0 ? palette : FALLBACK_COLORS

  return (
    <div className="fmt-dropdown color-picker">
      {/* Section label */}
      <div className="color-picker__label">
        {palette.length > 0 ? 'My Palette' : 'Colors'}
      </div>

      {/* Swatch grid */}
      <div className="color-picker__swatches">
        {swatches.map((c) => (
          <div key={c} className="color-swatch-wrap">
            <button
              className={`fmt-color-swatch${value === c ? ' fmt-color-swatch--active' : ''}`}
              style={{ background: c }} onClick={() => apply(c)} title={c}
            />
            {palette.length > 0 && (
              <button className="color-swatch__remove"
                onClick={(e) => { e.stopPropagation(); removeColor(c) }}
                title="Remove">×</button>
            )}
          </div>
        ))}
      </div>

      <div className="color-picker__divider" />

      {/* Hex input row */}
      <div className="color-picker__custom">
        <span className="color-picker__hash">#</span>
        <input
          className="color-picker__hex-input"
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6))}
          onKeyDown={(e) => { if (e.key === 'Enter') apply(hex) }}
          maxLength={6} placeholder="rrggbb" spellCheck={false}
        />

        {/* 🎨 — transparent native color input stacked on the emoji */}
        <div className="color-picker__wheel-wrap">
          <span className="color-picker__wheel-emoji" aria-hidden>🎨</span>
          <input
            type="color"
            value={hexValid ? `#${hex}` : '#111111'}
            onMouseDown={handleWheelMouseDown}
            onChange={(e) => pick(e.target.value)}
            className="color-picker__native-overlay"
            title="Open color wheel"
          />
        </div>

        {/* + Save to palette — does NOT close the picker */}
        <button
          className="color-picker__add-btn"
          onClick={() => { if (hexValid) { addColor(`#${hex}`); pick(hex) } }}
          disabled={!hexValid}
          title="Save to palette"
        >+</button>
      </div>
    </div>
  )
}

export default ColorPicker
