/**
 * SubAtlasPopover — popover to link an existing atlas or create a sub-atlas.
 * Restricts targets to Atlases (with circular loop prevention) or scaffolds new maps.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useDirStore, type DirEntry } from '../../../stores/useDirStore'
import { createSubAtlas } from '../../../services/dataLoader'
import { AtlasIcon } from '../shared/Icons'
import { logError } from '../../../utils/logger'

interface SubAtlasPopoverProps {
  x: number // percentage
  y: number // percentage
  parentAtlasId: string
  wikiId: string
  initialLabel?: string
  initialTargetId?: string
  initialColorHex?: string
  onConfirm: (label: string, targetId: string, colorHex: string) => void
  onCancel: () => void
  onDelete?: () => void
}

const PORTAL_COLORS = [
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Sky', hex: '#0ea5e9' },
]

// Loop prevention helper
function getAncestorAtlasIds(entries: DirEntry[], startId: string): Set<string> {
  const ancestors = new Set<string>()
  let currentId = startId
  while (true) {
    const entry = entries.find((e) => e.id === currentId)
    if (!entry || !entry.parentId) break
    const parentEntry = entries.find((e) => e.id === entry.parentId)
    if (parentEntry && parentEntry.kind === 'atlas') {
      ancestors.add(parentEntry.id)
      currentId = parentEntry.id
    } else {
      break
    }
  }
  return ancestors
}

const SubAtlasPopover: React.FC<SubAtlasPopoverProps> = ({
  x, y, parentAtlasId, wikiId,
  initialLabel = '', initialTargetId = '', initialColorHex = '#6366f1',
  onConfirm, onCancel, onDelete,
}) => {
  const { entries } = useDirStore()

  const [tab, setTab] = useState<'create' | 'link'>(initialTargetId ? 'link' : 'create')
  const [label, setLabel] = useState(initialLabel)
  const [colorHex, setColorHex] = useState(initialColorHex)
  const [newMapName, setNewMapName] = useState('')
  const [selectedAtlasId, setSelectedAtlasId] = useState('')
  const [loading, setLoading] = useState(false)

  const popoverRef = useRef<HTMLDivElement>(null)

  // Find all ancestor IDs to prevent circular referencing loops
  const ancestors = getAncestorAtlasIds(entries, parentAtlasId)

  // Filter existing atlases: must be kind 'atlas', not this atlas, and not any of its ancestors
  const linkableAtlases = entries.filter((e) => 
    e.kind === 'atlas' &&
    e.id !== parentAtlasId &&
    !ancestors.has(e.id)
  )

  useEffect(() => {
    // If editing, set selected atlas dropdown
    if (initialTargetId) {
      setSelectedAtlasId(initialTargetId)
    } else if (linkableAtlases.length > 0) {
      setSelectedAtlasId(linkableAtlases[0].id)
    }
  }, [initialTargetId, linkableAtlases.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle escape to cancel
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    try {
      if (initialTargetId) {
        // Edit mode
        onConfirm(label.trim() || 'Sub-Atlas Portal', initialTargetId, colorHex)
      } else if (tab === 'create') {
        // Create new sub-atlas on the fly
        if (!newMapName.trim()) return
        setLoading(true)
        const subAtlas = await createSubAtlas(newMapName.trim(), parentAtlasId, wikiId)
        onConfirm(label.trim() || subAtlas.name, subAtlas.id, colorHex)
      } else {
        // Link existing
        if (!selectedAtlasId) return
        const target = entries.find((en) => en.id === selectedAtlasId)
        onConfirm(label.trim() || target?.name || 'Sub-Atlas Portal', selectedAtlasId, colorHex)
      }
    } catch (err) {
      logError({ error_code: 'SUBATLAS_SAVE_FAILED', description: 'failed to save sub-atlas portal', context_payload: { err: String(err) } })
      window.alert('Failed to save sub-atlas portal.')
    } finally {
      setLoading(false)
    }
  }

  const targetEntryName = initialTargetId
    ? entries.find((e) => e.id === initialTargetId)?.name ?? 'Unknown Map'
    : ''

  return (
    <div
      ref={popoverRef}
      className="modal"
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -105%)', // center and float above coordinates
        zIndex: 1000,
        width: 280,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        padding: 16,
        margin: 0,
        background: '#1c2541', // menu panel color
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h4 style={{ margin: 0, fontSize: 14, color: 'var(--color-text)', fontWeight: 600 }}>
          {initialTargetId ? 'Edit Sub-Atlas Portal' : 'New Sub-Atlas Portal'}
        </h4>

        {/* Tab switcher (only when creating) */}
        {!initialTargetId && (
          <div
            style={{
              display: 'flex',
              background: '#0b132b',
              padding: 2,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <button
              type="button"
              style={{
                flex: 1,
                background: tab === 'create' ? '#1c2541' : 'none',
                border: 'none',
                color: tab === 'create' ? '#ffffff' : 'var(--color-text-muted)',
                fontSize: 11,
                padding: '4px 0',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
              }}
              onClick={() => setTab('create')}
            >
              ➕ Create New Map
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                background: tab === 'link' ? '#1c2541' : 'none',
                border: 'none',
                color: tab === 'link' ? '#ffffff' : 'var(--color-text-muted)',
                fontSize: 11,
                padding: '4px 0',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
              }}
              onClick={() => setTab('link')}
            >
              🔗 Link Existing
            </button>
          </div>
        )}

        {/* Tab Content */}
        {initialTargetId ? (
          /* Edit mode target display */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
             <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Linked Sub-Atlas</span>
             <span style={{ fontSize: 13, color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
               <AtlasIcon size={14} style={{ color: '#8E92FF' }} /> {targetEntryName}
             </span>
          </div>
        ) : tab === 'create' ? (
          /* Create New Sub-Atlas */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Sub-Atlas Name *</label>
            <input
              type="text"
              className="modal__input"
              style={{ margin: 0, fontSize: 13, padding: '6px 8px' }}
              placeholder="e.g. Underdark Cave, City Blueprint"
              value={newMapName}
              onChange={(e) => {
                setNewMapName(e.target.value)
                if (!label.trim()) setLabel(e.target.value)
              }}
              required
              disabled={loading}
            />
          </div>
        ) : (
          /* Link Existing */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Choose Sub-Atlas *</label>
            {linkableAtlases.length === 0 ? (
              <span style={{ fontSize: 11, color: '#f43f5e', padding: '4px 0' }}>
                No other maps available. Create a new one instead!
              </span>
            ) : (
              <select
                className="modal__input"
                style={{
                  margin: 0,
                  fontSize: 13,
                  padding: '6px 8px',
                  background: '#0b132b',
                  color: 'var(--color-text)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  width: '100%',
                }}
                value={selectedAtlasId}
                onChange={(e) => {
                  setSelectedAtlasId(e.target.value)
                  const target = linkableAtlases.find((t) => t.id === e.target.value)
                  if (target) setLabel(target.name)
                }}
                disabled={loading}
              >
                {linkableAtlases.map((a) => (
                  <option key={a.id} value={a.id}>
                    Atlas: {a.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Portal Custom Label Overlay */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Label (optional)</label>
          <input
            type="text"
            className="modal__input"
            style={{ margin: 0, fontSize: 13, padding: '6px 8px' }}
            placeholder="Custom portal label…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Color swatches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Portal Theme Color</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            {PORTAL_COLORS.map((c) => (
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
                disabled={loading}
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
              disabled={loading}
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              className="btn--ghost"
              style={{ padding: '6px 10px', fontSize: 12 }}
              onClick={onCancel}
              disabled={loading}
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
                disabled={loading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn--primary"
              style={{ padding: '6px 12px', fontSize: 12, margin: 0 }}
              disabled={loading || (!initialTargetId && tab === 'link' && !selectedAtlasId)}
            >
              {loading ? 'Creating...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default SubAtlasPopover
