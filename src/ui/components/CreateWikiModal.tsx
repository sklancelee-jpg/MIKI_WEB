/**
 * CreateWikiModal — modal for naming a new wiki and picking its color.
 * Triggered by the + button on HomeView.
 */

import React, { useState, useEffect, useRef } from 'react'
import { FULL_PALETTE } from './color/ColorPopover'

export const PRESET_COLORS = FULL_PALETTE

interface CreateWikiModalProps {
  onConfirm: (name: string, color: string) => void
  onCancel: () => void
}

const CreateWikiModal: React.FC<CreateWikiModalProps> = ({ onConfirm, onCancel }) => {
  const [name, setName]   = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const inputRef = useRef<HTMLInputElement>(null)

  // auto-focus the name input when modal opens
  useEffect(() => { inputRef.current?.focus() }, [])

  // close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) onConfirm(name.trim(), color)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">Create a wiki</h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="modal__input"
            type="text"
            placeholder="Wiki name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
          />
          <span className="modal__label">Color</span>
          <div className="modal__colors">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-swatch${c === color ? ' color-swatch--active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={c}
              />
            ))}
          </div>
          <div className="modal__actions">
            <button type="button" className="btn--ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn--primary" disabled={!name.trim()}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateWikiModal
