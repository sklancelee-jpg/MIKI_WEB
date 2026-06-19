/**
 * ToolbarCenter — formatting controls wired to the live Tiptap editor.
 * Font, size, B/I/U, color, lists, line/paragraph spacing, internal links.
 */

import React, { useState, useRef, useEffect } from 'react'
import type { Editor } from '@tiptap/core'
import ColorPicker   from './ColorPicker'
import FontPicker    from './FontPicker'
import LinkPicker    from './LinkPicker'
import SpacingPicker from './SpacingPicker'
import { LinkIcon }  from '../shared/Icons'

interface ToolbarCenterProps {
  editor:    Editor | null
  disabled?: boolean
}

const ToolbarCenter: React.FC<ToolbarCenterProps> = ({ editor, disabled }) => {
  const [showFonts,   setShowFonts]   = useState(false)
  const [showColor,   setShowColor]   = useState(false)
  const [showLink,    setShowLink]    = useState(false)
  const [showSpacing, setShowSpacing] = useState(false)
  const fontWrapRef      = useRef<HTMLDivElement>(null)
  const colorWrapRef     = useRef<HTMLDivElement>(null)
  const linkWrapRef      = useRef<HTMLDivElement>(null)
  const spacingWrapRef   = useRef<HTMLDivElement>(null)
  // True while the macOS Colors panel is open — prevents mousedown from closing the picker
  const colorWheelActive = useRef(false)

  const hasSelection  = editor ? !editor.state.selection.empty : false
  const isLinkActive  = editor?.isActive('internalLink')  ?? false
  const isBold        = editor?.isActive('bold')          ?? false
  const isItalic      = editor?.isActive('italic')        ?? false
  const isUnderline   = editor?.isActive('underline')     ?? false
  const isBulletList  = editor?.isActive('bulletList')    ?? false
  const isOrderedList = editor?.isActive('orderedList')   ?? false
  const textColor     = (editor?.getAttributes('textStyle').color      as string | undefined) ?? '#111111'
  const fontFamily    = (editor?.getAttributes('textStyle').fontFamily as string | undefined) ?? 'inherit'
  const rawSize       = editor?.getAttributes('textStyle').fontSize as string | undefined
  const fontSize      = rawSize ? parseInt(rawSize) : 16

  const fontLabel = fontFamily === 'inherit' ? 'Font' : fontFamily.split(',')[0]

  const closeAll = () => { setShowFonts(false); setShowColor(false); setShowLink(false); setShowSpacing(false) }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (showFonts   && fontWrapRef.current    && !fontWrapRef.current.contains(t))    setShowFonts(false)
      // Never close the color picker while the OS Colors panel is open
      if (showColor   && !colorWheelActive.current && colorWrapRef.current && !colorWrapRef.current.contains(t)) setShowColor(false)
      if (showLink    && linkWrapRef.current    && !linkWrapRef.current.contains(t))    setShowLink(false)
      if (showSpacing && spacingWrapRef.current && !spacingWrapRef.current.contains(t)) setShowSpacing(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showFonts, showColor, showLink, showSpacing])

  return (
    <div className={`toolbar-center${disabled ? ' toolbar-center--disabled' : ''}`}>

      {/* Font family */}
      <div className="fmt-dropdown-wrap" ref={fontWrapRef}>
        <button className="fmt-btn fmt-btn--font"
          onClick={() => { setShowFonts((v) => !v); setShowColor(false); setShowSpacing(false) }}
          data-tooltip="Select font">
          {fontLabel} ▾
        </button>
        {showFonts && (
          <FontPicker value={fontFamily}
            onChange={(f) => editor?.chain().focus().setFontFamily(f).run()}
            onClose={() => setShowFonts(false)} />
        )}
      </div>

      {/* Font size */}
      <input className="fmt-size-input" type="number" min={8} max={96} value={fontSize}
        onChange={(e) => {
          const n = parseInt(e.target.value)
          if (n >= 8 && n <= 96) editor?.chain().focus().setFontSize(`${n}px`).run()
        }}
        data-tooltip="Font size (px)" />

      {/* B / I / U */}
      <div className="fmt-btn-group">
        <button className={`fmt-btn fmt-btn--icon${isBold      ? ' fmt-btn--active' : ''}`}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          data-tooltip="Bold"><strong>B</strong></button>
        <button className={`fmt-btn fmt-btn--icon${isItalic    ? ' fmt-btn--active' : ''}`}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          data-tooltip="Italic"><em>I</em></button>
        <button className={`fmt-btn fmt-btn--icon${isUnderline ? ' fmt-btn--active' : ''}`}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          style={{ textDecoration: 'underline' }} data-tooltip="Underline">U</button>
      </div>

      {/* Lists */}
      <div className="fmt-btn-group">
        <button className={`fmt-btn fmt-btn--icon${isBulletList  ? ' fmt-btn--active' : ''}`}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          data-tooltip="Bullet list" title="Bullet list">≡</button>
        <button className={`fmt-btn fmt-btn--icon${isOrderedList ? ' fmt-btn--active' : ''}`}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          data-tooltip="Numbered list" title="Numbered list">#</button>
      </div>

      {/* Line / paragraph spacing */}
      <div className="fmt-dropdown-wrap" ref={spacingWrapRef}>
        <button className="fmt-btn fmt-btn--icon"
          onClick={() => { setShowSpacing((v) => !v); closeAll(); setShowSpacing((v) => !v) }}
          data-tooltip="Line & paragraph spacing" title="Spacing">↕</button>
        {showSpacing && editor && (
          <SpacingPicker editor={editor} onClose={() => setShowSpacing(false)} />
        )}
      </div>

      {/* Internal link (selection-only) */}
      {(hasSelection || isLinkActive) && editor && (
        <div className="fmt-dropdown-wrap" ref={linkWrapRef}>
          <button className={`fmt-btn fmt-btn--icon${isLinkActive ? ' fmt-btn--active' : ''}`}
            onClick={() => { setShowLink((v) => !v); setShowFonts(false); setShowColor(false) }}
            data-tooltip={isLinkActive ? 'Edit / remove link' : 'Link to page or folder'}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <LinkIcon size={16} />
          </button>
          {showLink && <LinkPicker editor={editor} onClose={() => setShowLink(false)} />}
        </div>
      )}

      {/* Text color */}
      <div className="fmt-dropdown-wrap" ref={colorWrapRef}>
        <button className="fmt-btn fmt-btn--color"
          onClick={() => { setShowColor((v) => !v); setShowFonts(false); setShowSpacing(false) }}
          data-tooltip="Text color">
          <span className="fmt-color-preview" style={{ background: textColor }} />A
        </button>
        {showColor && (
          <ColorPicker value={textColor}
            onChange={(hex) => editor?.chain().focus().setColor(hex).run()}
            onClose={() => setShowColor(false)}
            onWheelOpen={() => { colorWheelActive.current = true }}
            onWheelClose={() => { colorWheelActive.current = false }} />
        )}
      </div>

    </div>
  )
}

export default ToolbarCenter
