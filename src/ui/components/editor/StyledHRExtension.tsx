/**
 * StyledHRExtension — custom horizontal rule with per-instance styling.
 * Attrs: color (hex), thickness (px 1–8), hrStyle (solid|dashed|dotted|double)
 * Click the rule to reveal an inline edit toolbar.
 */

import React, { useRef } from 'react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'

/* ── Types ──────────────────────────────────────────────────── */

export type HRLineStyle = 'solid' | 'dashed' | 'dotted' | 'double'

const HR_LINE_STYLES: HRLineStyle[] = ['solid', 'dashed', 'dotted', 'double']

interface HRAttrs {
  color:     string
  thickness: number
  hrStyle:   HRLineStyle
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    styledHorizontalRule: {
      setStyledHR: (attrs?: Partial<HRAttrs>) => ReturnType
    }
  }
}

/* ── NodeView component ─────────────────────────────────────── */

interface HRNodeViewProps {
  node:             { attrs: HRAttrs }
  updateAttributes: (attrs: Partial<HRAttrs>) => void
  selected:         boolean
}

const HRNodeView: React.FC<HRNodeViewProps> = ({ node, updateAttributes, selected }) => {
  const { color, thickness, hrStyle } = node.attrs
  const colorRef = useRef<HTMLInputElement>(null)

  return (
    <NodeViewWrapper className="styled-hr-wrap" contentEditable={false}>
      <hr
        className={`styled-hr${selected ? ' styled-hr--selected' : ''}`}
        style={{
          borderTop:    `${thickness}px ${hrStyle} ${color}`,
          borderBottom: 'none',
          borderLeft:   'none',
          borderRight:  'none',
          margin:       '12px 0',
          cursor:       'pointer',
        }}
      />

      {selected && (
        <div className="styled-hr__toolbar" contentEditable={false}>
          {/* Line style buttons */}
          {HR_LINE_STYLES.map((s) => (
            <button
              key={s}
              className={`styled-hr__style-btn${hrStyle === s ? ' styled-hr__style-btn--active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); updateAttributes({ hrStyle: s }) }}
              title={s}
            >
              {s}
            </button>
          ))}

          <div className="styled-hr__sep" />

          {/* Color swatch → opens native color wheel */}
          <button
            className="styled-hr__color-btn"
            style={{ background: color }}
            onMouseDown={(e) => { e.preventDefault(); colorRef.current?.click() }}
            title="Line color"
          />
          <input
            ref={colorRef}
            type="color"
            value={color}
            onChange={(e) => updateAttributes({ color: e.target.value })}
            className="styled-hr__native-color"
            tabIndex={-1}
          />

          <div className="styled-hr__sep" />

          {/* Thickness stepper */}
          <div className="styled-hr__thickness">
            <button
              onMouseDown={(e) => { e.preventDefault(); updateAttributes({ thickness: Math.max(1, thickness - 1) }) }}
            >−</button>
            <span>{thickness}px</span>
            <button
              onMouseDown={(e) => { e.preventDefault(); updateAttributes({ thickness: Math.min(8, thickness + 1) }) }}
            >+</button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  )
}

/* ── Extension ──────────────────────────────────────────────── */

export const StyledHRExtension = Node.create({
  name:       'styledHorizontalRule',
  group:      'block',
  atom:       true,
  selectable: true,
  draggable:  false,

  addAttributes() {
    return {
      color:     { default: '#cccccc' },
      thickness: { default: 1 },
      hrStyle:   { default: 'solid' },
    }
  },

  parseHTML() {
    return [{ tag: 'hr' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['hr', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    // Cast: Tiptap v2's ReactNodeViewProps is a superset not exported cleanly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ReactNodeViewRenderer(HRNodeView as any)
  },

  addCommands() {
    return {
      // Implicit command arg typing — same pattern as FontSizeExtension
      setStyledHR: (attrs?: Partial<HRAttrs>) => ({ commands }) =>
        commands.insertContent({ type: this.name, attrs: attrs ?? {} }),
    }
  },
})
