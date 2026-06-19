/**
 * LineHeightExtension — adds setLineHeight and setParagraphSpacing commands.
 * Both are stored as paragraph-level node attributes (inline style).
 * Requires paragraph nodes (included in StarterKit).
 */

import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight:       (value: string) => ReturnType
      setParagraphSpacing: (value: string) => ReturnType
    }
  }
}

export const LineHeightExtension = Extension.create({
  name: 'lineHeight',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML:  (el) => (el as HTMLElement).style.lineHeight || null,
            renderHTML: (attrs) =>
              attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {},
          },
          paragraphSpacing: {
            default: null,
            parseHTML:  (el) => (el as HTMLElement).style.marginBottom || null,
            renderHTML: (attrs) =>
              attrs.paragraphSpacing ? { style: `margin-bottom: ${attrs.paragraphSpacing}` } : {},
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineHeight: (value: string) => ({ commands }) =>
        commands.updateAttributes('paragraph', { lineHeight: value }),
      setParagraphSpacing: (value: string) => ({ commands }) =>
        commands.updateAttributes('paragraph', { paragraphSpacing: value }),
    }
  },
})
