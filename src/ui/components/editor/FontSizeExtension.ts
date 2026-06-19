/**
 * FontSizeExtension — adds setFontSize / unsetFontSize commands.
 * Piggybacks on the existing TextStyle mark to store inline font-size CSS.
 * Requires @tiptap/extension-text-style to be loaded in the editor.
 */

import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      /** Set inline font size, e.g. setFontSize('18px') */
      setFontSize:   (size: string) => ReturnType
      /** Remove inline font size, restoring the default */
      unsetFontSize: () => ReturnType
    }
  }
}

export const FontSizeExtension = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
            renderHTML: (attrs) =>
              attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})
