/**
 * RightPanel — Attributes panel for the Page View.
 * Cover image slot (click to upload) + inline-editable attribute table.
 * Data lives in useAttrStore, keyed by pageId.
 */

import React, { useRef, useState, useEffect } from 'react'
import AttrRow from './AttrRow'
import { useAttrStore } from '../../../stores/useAttrStore'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../shared/Icons'

interface RightPanelProps {
  open: boolean
  pageId: string
  onToggle: () => void
}

const RightPanel: React.FC<RightPanelProps> = ({ open, pageId, onToggle }) => {
  const { getPage, addAttr, updateAttr, removeAttr, setCoverImage } = useAttrStore()
  const { attributes, coverImage } = getPage(pageId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newAttrId, setNewAttrId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCoverImage(pageId, reader.result as string)
    reader.readAsDataURL(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  const handleAddAttr = () => {
    const id = addAttr(pageId)
    setNewAttrId(id)
  }

  return (
    <aside className={`panel panel--right${open ? '' : ' panel--collapsed'}${ready ? ' panel--ready' : ''}`}>
      <button
        className="panel__toggle panel__toggle--right"
        onClick={onToggle}
        aria-label={open ? 'Collapse attributes' : 'Expand attributes'}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {open ? <ChevronRightIcon size={12} /> : <ChevronLeftIcon size={12} />}
      </button>

      <div className="panel__content">
        {/* ── Cover image ── */}
        <div
          className="cover-image-slot"
          onClick={() => fileInputRef.current?.click()}
          title="Click to upload a reference image"
        >
          {coverImage ? (
            <>
              <img src={coverImage} alt="Cover" className="cover-image-slot__img" />
              <button
                className="cover-image-slot__remove"
                onClick={(e) => { e.stopPropagation(); setCoverImage(pageId, null) }}
                title="Remove image"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CloseIcon size={12} />
              </button>
            </>
          ) : (
            <span className="cover-image-slot__label">
              + Reference image
            </span>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />

        {/* ── Attributes ── */}
        <h3 className="panel__heading">Attributes</h3>

        {attributes.length > 0 ? (
          <table className="attr-table">
            <tbody>
              {attributes.map((attr) => (
                <AttrRow
                  key={attr.id}
                  attr={attr}
                  autoFocusLabel={attr.id === newAttrId}
                  onUpdate={(patch) => {
                    updateAttr(pageId, attr.id, patch)
                    if (attr.id === newAttrId) setNewAttrId(null)
                  }}
                  onRemove={() => removeAttr(pageId, attr.id)}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="panel__empty">No attributes yet.</p>
        )}

        <button className="attr-add-btn" onClick={handleAddAttr}>
          + Add attribute
        </button>
      </div>
    </aside>
  )
}

export default RightPanel
