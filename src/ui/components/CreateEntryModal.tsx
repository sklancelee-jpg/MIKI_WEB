/**
 * CreateEntryModal — two-step modal for creating a new folder or page.
 * Step 1: choose kind (Folder | Page)
 * Step 2: name + (if folder) color picker
 */

import React, { useState, useEffect, useRef } from 'react'
import type { EntryKind } from '../../stores/useDirStore'
import { PRESET_COLORS } from './CreateWikiModal'
import { FolderPickIcon, PagePickIcon, AtlasPickIcon } from './shared/Icons'

interface CreateEntryModalProps {
  onConfirm: (kind: EntryKind, name: string, colorHex: string) => void
  onCancel: () => void
}

const CreateEntryModal: React.FC<CreateEntryModalProps> = ({ onConfirm, onCancel }) => {
  const [step, setStep]   = useState<'pick' | 'form'>('pick')
  const [kind, setKind]   = useState<EntryKind>('folder')
  const [name, setName]   = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'form') inputRef.current?.focus()
  }, [step])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  const handlePick = (k: EntryKind) => { setKind(k); setStep('form') }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) onConfirm(kind, name.trim(), kind === 'folder' ? color : '#ffffff')
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {step === 'pick' ? (
          <>
            <h2 className="modal__title">New item</h2>
            <div className="entry-pick-grid">
              <button className="entry-pick-btn" onClick={() => handlePick('folder')}>
                <FolderPickIcon />
                <span>Folder</span>
              </button>
              <button className="entry-pick-btn" onClick={() => handlePick('page')}>
                <PagePickIcon />
                <span>Page</span>
              </button>
              <button className="entry-pick-btn" onClick={() => handlePick('atlas')}>
                <AtlasPickIcon />
                <span>Atlas</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="modal__title">
              New {kind === 'folder' ? 'folder' : kind === 'page' ? 'page' : 'atlas'}
            </h2>
            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                className="modal__input"
                type="text"
                placeholder={kind === 'folder' ? 'Folder name' : kind === 'page' ? 'Page name' : 'Atlas name'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
              />
              {kind === 'folder' && (
                <>
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
                </>
              )}
              <div className="modal__actions">
                <button type="button" className="btn--ghost" onClick={() => setStep('pick')}>
                  ← Back
                </button>
                <button type="submit" className="btn--primary" disabled={!name.trim()}>
                  Create
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default CreateEntryModal
