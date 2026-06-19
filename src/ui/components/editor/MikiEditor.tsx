/**
 * MikiEditor — thin wrapper around Tiptap's EditorContent.
 * The editor instance is created in PageView and passed down here.
 * Styling lives in global.css under .miki-editor and .ProseMirror.
 */

import React from 'react'
import { EditorContent, type Editor } from '@tiptap/react'

interface MikiEditorProps {
  editor: Editor | null
}

const MikiEditor: React.FC<MikiEditorProps> = ({ editor }) => (
  <EditorContent editor={editor} className="miki-editor" />
)

export default MikiEditor
