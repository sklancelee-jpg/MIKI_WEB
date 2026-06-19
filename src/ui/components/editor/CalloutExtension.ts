/**
 * CalloutExtension — custom block node for drawing attention to notes/warnings.
 * Attributes: type ('info' | 'warning' | 'success' | 'danger') and emoji.
 * Renders nested block nodes via ReactNodeViewRenderer.
 */

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CalloutNodeView from './CalloutNodeView'

export interface CalloutAttrs {
  type:  string
  emoji: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      /** Wraps selected blocks in a callout container, or toggles it. */
      toggleCallout: (attrs?: Partial<CalloutAttrs>) => ReturnType
    }
  }
}

export const CalloutExtension = Node.create({
  name:       'callout',
  group:      'block',
  content:    'block+', // allow headings, lists, paragraphs inside
  defining:   true,     // makes the callout content stable during backspace
  selectable: true,
  draggable:  false,

  addAttributes() {
    return {
      type:  { default: 'info' },
      emoji: { default: '💡' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
        getAttrs: (el) => {
          const e = el as HTMLElement
          return {
            type:  e.getAttribute('data-callout-type') ?? 'info',
            emoji: e.getAttribute('data-callout-emoji') ?? '💡',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type':          'callout',
        'data-callout-type':  HTMLAttributes.type,
        'data-callout-emoji': HTMLAttributes.emoji,
        'class':              `miki-callout-wrapper miki-callout--${HTMLAttributes.type}`,
      }),
      0, // content hole
    ]
  },

  addNodeView() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ReactNodeViewRenderer(CalloutNodeView as any)
  },

  addCommands() {
    return {
      toggleCallout: (attrs?: Partial<CalloutAttrs>) => ({ commands }) =>
        commands.toggleWrap(this.name, attrs ?? {}),
    }
  },
})
