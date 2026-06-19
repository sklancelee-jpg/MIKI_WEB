/**
 * AttrRow — a single editable label/value pair in the attribute table.
 * Clicking either cell turns it into an input. Blur or Enter commits.
 * The × button removes the row (shown on hover).
 */

import React, { useState, useRef, useEffect } from 'react'
import type { Attribute } from '../../../stores/useAttrStore'
import { CloseIcon } from '../shared/Icons'

interface AttrRowProps {
  attr: Attribute
  autoFocusLabel?: boolean
  onUpdate: (patch: Partial<Pick<Attribute, 'label' | 'value'>>) => void
  onRemove: () => void
}

type Field = 'label' | 'value'

const AttrRow: React.FC<AttrRowProps> = ({ attr, autoFocusLabel, onUpdate, onRemove }) => {
  const [editing, setEditing] = useState<Field | null>(autoFocusLabel ? 'label' : null)
  const [draft, setDraft]     = useState({ label: attr.label, value: attr.value })
  const inputRef              = useRef<HTMLInputElement>(null)

  // Focus the input whenever editing state activates
  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  // Auto-focus label on new row
  useEffect(() => {
    if (autoFocusLabel) setEditing('label')
  }, [autoFocusLabel])

  const commit = (field: Field) => {
    onUpdate({ [field]: draft[field] })
    setEditing(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: Field) => {
    if (e.key === 'Enter') {
      commit(field)
      // Tab from label → value
      if (field === 'label') setEditing('value')
    }
    if (e.key === 'Escape') {
      setDraft((d) => ({ ...d, [field]: attr[field] }))
      setEditing(null)
    }
    if (e.key === 'Tab' && field === 'label') {
      e.preventDefault()
      commit('label')
      setEditing('value')
    }
  }

  const renderCell = (field: Field, placeholder: string) => {
    if (editing === field) {
      return (
        <input
          ref={inputRef}
          className="attr-cell-input"
          value={draft[field]}
          placeholder={placeholder}
          onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
          onBlur={() => commit(field)}
          onKeyDown={(e) => handleKeyDown(e, field)}
        />
      )
    }
    return (
      <span
        className={`attr-cell${!draft[field] ? ' attr-cell--empty' : ''}`}
        onClick={() => setEditing(field)}
        title="Click to edit"
      >
        {draft[field] || placeholder}
      </span>
    )
  }

  return (
    <tr className="attr-table__row attr-row">
      <td className="attr-table__label">{renderCell('label', 'Label')}</td>
      <td className="attr-table__value">{renderCell('value', 'Value')}</td>
      <td className="attr-row__remove">
        <button
          className="attr-remove-btn"
          onClick={onRemove}
          aria-label="Remove attribute"
          title="Remove"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <CloseIcon size={12} />
        </button>
      </td>
    </tr>
  )
}

export default AttrRow
