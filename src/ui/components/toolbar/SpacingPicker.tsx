/**
 * SpacingPicker — dropdown presets for line height and paragraph spacing.
 * Appears as a .fmt-dropdown below its trigger button in the toolbar.
 */

import React from 'react'
import type { Editor } from '@tiptap/core'

const LINE_HEIGHTS = [
  { label: 'Single',           value: '1' },
  { label: 'Slight — 1.15×',  value: '1.15' },
  { label: 'Default — 1.5×',  value: '1.5' },
  { label: 'Double — 2×',     value: '2' },
]

const PARA_SPACINGS = [
  { label: 'None',    value: '0px' },
  { label: 'Small',   value: '6px' },
  { label: 'Medium',  value: '14px' },
  { label: 'Large',   value: '28px' },
]

interface Props {
  editor:  Editor
  onClose: () => void
}

const SpacingPicker: React.FC<Props> = ({ editor, onClose }) => {
  const curLH = (editor.getAttributes('paragraph').lineHeight  as string | null) ?? '1.5'
  const curPS = (editor.getAttributes('paragraph').paragraphSpacing as string | null) ?? '14px'

  const applyLH = (v: string) => { editor.chain().focus().setLineHeight(v).run(); onClose() }
  const applyPS = (v: string) => { editor.chain().focus().setParagraphSpacing(v).run(); onClose() }

  return (
    <div className="fmt-dropdown spacing-picker">
      <div className="spacing-picker__label">Line Spacing</div>
      {LINE_HEIGHTS.map(({ label, value }) => (
        <button
          key={value}
          className={`fmt-dropdown__item${curLH === value ? ' fmt-dropdown__item--active' : ''}`}
          onClick={() => applyLH(value)}
        >
          {label}
        </button>
      ))}

      <div className="spacing-picker__divider" />

      <div className="spacing-picker__label">Paragraph Spacing</div>
      {PARA_SPACINGS.map(({ label, value }) => (
        <button
          key={value}
          className={`fmt-dropdown__item${curPS === value ? ' fmt-dropdown__item--active' : ''}`}
          onClick={() => applyPS(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default SpacingPicker
