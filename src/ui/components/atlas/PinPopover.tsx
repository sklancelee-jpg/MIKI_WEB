/**
 * PinPopover — floating modal/popover to create or edit a map pin.
 */

import React, { useState, useEffect, useRef } from 'react'
import { search, type SearchResult } from '../../../services/searchService'
import { useDirStore } from '../../../stores/useDirStore'
import { useWikiStore } from '../../../stores/useWikiStore'
import { FolderIcon, PageIcon, AtlasIcon } from '../shared/Icons'

const KindIcon: React.FC<{ kind: string; size?: number }> = ({ kind, size = 14 }) => {
  if (kind === 'folder') return <FolderIcon size={size} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
  if (kind === 'page') return <PageIcon size={size} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
  if (kind === 'atlas') return <AtlasIcon size={size} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
  return null
}

interface PinPopoverProps {
  x: number // percentage position
  y: number // percentage position
  initialLabel?: string
  initialTargetId?: string
  initialColorHex?: string
  onConfirm: (label: string, targetId: string, colorHex: string) => void
  onCancel: () => void
  onDelete?: () => void
}

const PIN_COLORS = [
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Sky', hex: '#0ea5e9' },
]

const PinPopover: React.FC<PinPopoverProps> = ({
  x, y, initialLabel = '', initialTargetId = '', initialColorHex = '#6366f1',
  onConfirm, onCancel, onDelete,
}) => {
  const { entries } = useDirStore()
  const { wikis } = useWikiStore()

  const [label, setLabel] = useState(initialLabel)
  const [colorHex, setColorHex] = useState(initialColorHex)
  const [targetId, setTargetId] = useState(initialTargetId)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  const popoverRef = useRef<HTMLDivElement>(null)

  // Initialize search input text from initial target
  useEffect(() => {
    if (initialTargetId) {
      const entry = entries.find((e) => e.id === initialTargetId)
      if (entry) {
        setSearchQuery(entry.name)
      }
    }
  }, [initialTargetId, entries])

  // Run search when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If empty, show first few pages/folders as default suggestions
      const defaultSuggestions = entries
        .filter((e) => e.kind === 'page' || e.kind === 'folder' || e.kind === 'atlas')
        .slice(0, 5)
        .map((e) => ({
          kind: e.kind as 'page' | 'folder' | 'atlas',
          id: e.id,
          name: e.name,
          path: '',
          displayPath: e.name,
          navigateTo: '',
        }))
      setSearchResults(defaultSuggestions)
    } else {
      const results = search(searchQuery, wikis, entries, 5)
      setSearchResults(results.filter((r) => r.kind !== 'wiki')) // Only link to pages/folders/atlases
    }
  }, [searchQuery, entries, wikis])

  // Handle escape to cancel
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  const handleSelectTarget = (result: SearchResult) => {
    setTargetId(result.id)
    setSearchQuery(result.name)
    if (!label.trim()) {
      setLabel(result.name) // Auto-populate label with linked item's name
    }
    setShowDropdown(false)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (targetId) {
      onConfirm(label.trim() || searchQuery || 'Pin', targetId, colorHex)
    }
  }

  // Position popover based on percentage coordinate
  // Offset to display above or beside click coordinates
  return (
    <div
      ref={popoverRef}
      className="modal"
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -105%)', // center horizontally, float above click
        zIndex: 1000,
        width: 280,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        padding: 16,
        margin: 0,
        background: '#1c2541', // menu panel color token
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h4 style={{ margin: 0, fontSize: 14, color: 'var(--color-text)', fontWeight: 600 }}>
          {initialTargetId ? 'Edit Pin' : 'New Pin'}
        </h4>

        {/* Search for Target Link */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
          <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Link Target *</label>
          <input
            type="text"
            className="modal__input"
            style={{ margin: 0, fontSize: 13, padding: '6px 8px' }}
            placeholder="Search page or folder…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setTargetId('') // Reset target if typing
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            required
          />

          {/* Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#0b132b', // studio backdrop color token
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-sm)',
                maxHeight: 180,
                overflowY: 'auto',
                zIndex: 1010,
                marginTop: 4,
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              }}
            >
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectTarget(r)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text)',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                    <KindIcon kind={r.kind} /> {r.name}
                  </span>
                  {r.path && (
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                      {r.path}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pin Custom Label */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Label (optional)</label>
          <input
            type="text"
            className="modal__input"
            style={{ margin: 0, fontSize: 13, padding: '6px 8px' }}
            placeholder="Custom label overlay…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        {/* Color swatches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Pin Color</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            {PIN_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                className={`color-swatch${c.hex === colorHex ? ' color-swatch--active' : ''}`}
                style={{
                  background: c.hex,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: c.hex === colorHex ? '2px solid white' : 'none',
                  cursor: 'pointer',
                  padding: 0,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
                onClick={() => setColorHex(c.hex)}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
          {onDelete ? (
            <button
              type="button"
              className="btn--ghost"
              style={{ padding: '6px 10px', color: '#f43f5e', fontSize: 12 }}
              onClick={onDelete}
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              className="btn--ghost"
              style={{ padding: '6px 10px', fontSize: 12 }}
              onClick={onCancel}
            >
              Cancel
            </button>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            {onDelete && (
              <button
                type="button"
                className="btn--ghost"
                style={{ padding: '6px 10px', fontSize: 12 }}
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn--primary"
              style={{ padding: '6px 12px', fontSize: 12, margin: 0 }}
              disabled={!targetId}
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default PinPopover
