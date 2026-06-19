/**
 * Toolbar — full-width top bar for the Page View.
 * Three zones: Left (back + search) | Center (format) | Right (export + toggle).
 * Receives the live Tiptap editor instance from PageView.
 */

import React from 'react'
import type { Editor } from '@tiptap/core'
import ToolbarLeft from './ToolbarLeft'
import ToolbarCenter from './ToolbarCenter'
import ToolbarRight from './ToolbarRight'
import type { EditMode } from '../../../stores/usePageViewStore'

interface ToolbarProps {
  editor: Editor | null
  pageId: string
  editMode: EditMode
  onEditModeChange: (mode: EditMode) => void
}

const Toolbar: React.FC<ToolbarProps> = ({
  editor,
  pageId,
  editMode,
  onEditModeChange,
}) => {
  return (
    <div className="toolbar">
      <ToolbarLeft pageId={pageId} />
      <ToolbarCenter editor={editor} disabled={editMode === 'preview'} />
      <ToolbarRight
        editor={editor}
        editMode={editMode}
        onEditModeChange={onEditModeChange}
        pageId={pageId}
      />
    </div>
  )
}

export default Toolbar
