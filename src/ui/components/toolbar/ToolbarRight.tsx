/**
 * ToolbarRight — export button (PDF/Word/TXT/MD) + edit/preview toggle.
 * Receives the live editor so it can pass getJSON() to exportService.
 */

import React, { useState, useRef, useEffect } from 'react'
import type { Editor } from '@tiptap/core'
import type { EditMode } from '../../../stores/usePageViewStore'
import { useDirStore } from '../../../stores/useDirStore'
import { exportPage, type ExportFormat } from '../../../services/exportService'
import PageBorderPicker from './PageBorderPicker'
import { DownloadIcon, PencilIcon, EyeIcon, FrameIcon } from '../shared/Icons'

interface ToolbarRightProps {
  editor:           Editor | null
  editMode:         EditMode
  onEditModeChange: (mode: EditMode) => void
  pageId:           string
}

const EXPORT_FORMATS: { key: ExportFormat; label: string; ext: string }[] = [
  { key: 'pdf', label: 'PDF',        ext: '.pdf' },
  { key: 'rtf', label: 'Word (RTF)', ext: '.rtf' },
  { key: 'txt', label: 'Plain text', ext: '.txt' },
  { key: 'md',  label: 'Markdown',   ext: '.md'  },
]

const ToolbarRight: React.FC<ToolbarRightProps> = ({
  editor,
  editMode,
  onEditModeChange,
  pageId,
}) => {
  const [showExport, setShowExport]   = useState(false)
  const [showBorder, setShowBorder]   = useState(false)
  const borderWrapRef = useRef<HTMLDivElement>(null)
  const { entries } = useDirStore()
  const page = entries.find((e) => e.id === pageId)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showBorder && borderWrapRef.current && !borderWrapRef.current.contains(e.target as Node)) {
        setShowBorder(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showBorder])

  const handleExport = (format: ExportFormat) => {
    setShowExport(false)
    if (!editor || !page) return

    exportPage({
      format,
      pageName: page.name,
      doc:      editor.getJSON(),
    })
  }

  return (
    <div className="toolbar-right">
      {/* Page border */}
      <div className="fmt-dropdown-wrap" ref={borderWrapRef}>
        <button
          className="toolbar-icon-btn"
          onClick={() => setShowBorder((v) => !v)}
          title="Page border style"
          aria-label="Page border style"
        >
          <FrameIcon size={15} />
        </button>
        {showBorder && (
          <PageBorderPicker
            pageId={pageId}
            onClose={() => setShowBorder(false)}
          />
        )}
      </div>

      {/* Export */}
      <div className="fmt-dropdown-wrap">
        <button
          className="toolbar-icon-btn"
          onClick={() => setShowExport((v) => !v)}
          title="Export page"
          aria-label="Export options"
          disabled={!editor}
        >
          <DownloadIcon size={15} />
        </button>

        {showExport && (
          <div className="fmt-dropdown fmt-dropdown--right">
            {EXPORT_FORMATS.map(({ key, label, ext }) => (
              <button
                key={key}
                className="fmt-dropdown__item"
                onClick={() => handleExport(key)}
              >
                <span>{label}</span>
                <span className="fmt-dropdown__ext">{ext}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edit / Preview toggle */}
      <div className="edit-toggle">
        <button
          className={`edit-toggle__btn${editMode === 'edit' ? ' edit-toggle__btn--active' : ''}`}
          onClick={() => onEditModeChange('edit')}
          title="Edit mode"
          aria-label="Edit mode"
        >
          <PencilIcon size={13} />
        </button>
        <button
          className={`edit-toggle__btn${editMode === 'preview' ? ' edit-toggle__btn--active' : ''}`}
          onClick={() => onEditModeChange('preview')}
          title="Preview mode"
          aria-label="Preview mode"
        >
          <EyeIcon size={13} />
        </button>
      </div>
    </div>
  )
}

export default ToolbarRight
