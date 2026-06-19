import React, { useState, useEffect } from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { InfoIcon, WarningIcon, SuccessIcon, DangerIcon } from '../shared/Icons'

export interface CalloutNodeViewProps {
  node: {
    attrs: {
      type:  string
      emoji: string
    }
  }
  updateAttributes: (attrs: { type?: string; emoji?: string }) => void
  selected:         boolean
}

const CALLOUT_TYPES = [
  { type: 'info',    emoji: '💡', label: 'Info',    Icon: InfoIcon },
  { type: 'warning', emoji: '⚠️', label: 'Warning', Icon: WarningIcon },
  { type: 'success', emoji: '✅', label: 'Success', Icon: SuccessIcon },
  { type: 'danger',  emoji: '🚨', label: 'Danger',  Icon: DangerIcon },
]

const CalloutNodeView: React.FC<CalloutNodeViewProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const { type } = node.attrs
  const [showToolbar, setShowToolbar] = useState(false)

  // Auto-hide toolbar when selection is lost
  useEffect(() => {
    if (!selected) {
      setShowToolbar(false)
    }
  }, [selected])

  const handleTypeChange = (newType: string, newEmoji: string) => {
    updateAttributes({ type: newType, emoji: newEmoji })
  }

  // Get active type's icon
  const ActiveType = CALLOUT_TYPES.find((t) => t.type === type) || CALLOUT_TYPES[0]
  const ActiveIcon = ActiveType.Icon

  return (
    <NodeViewWrapper className={`miki-callout-node-wrap miki-callout--${type}`}>
      <div
        className="miki-callout"
        onClick={() => { if (selected) setShowToolbar(true) }}
      >
        {/* SVG Icon Container (replaces emoji input) */}
        <div className="miki-callout__icon" contentEditable={false} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ActiveIcon size={20} />
        </div>

        {/* Nested Content Placeholder */}
        <NodeViewContent className="miki-callout__content" />
      </div>

      {/* Floating Type Selector Toolbar */}
      {selected && showToolbar && (
        <div className="miki-callout__toolbar" contentEditable={false}>
          {CALLOUT_TYPES.map((t) => {
            const ButtonIcon = t.Icon
            return (
              <button
                key={t.type}
                className={`miki-callout__type-btn${type === t.type ? ' miki-callout__type-btn--active' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleTypeChange(t.type, t.emoji)
                }}
                title={`Change style to ${t.label}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span className="miki-callout__type-btn-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <ButtonIcon size={14} />
                </span>
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </NodeViewWrapper>
  )
}

export default CalloutNodeView
