/**
 * InternalLinkExtension — Tiptap mark for linking text to MIKI pages/folders.
 *
 * Data integrity design:
 *   - targetId   — canonical UUID reference, never changes even on rename/move
 *   - targetKind — 'page' | 'folder'
 *   - targetName — snapshot of the name at link-creation time.
 *                  Used as display fallback if the target is later deleted.
 *                  Navigation always re-resolves via targetId at click time.
 *
 * Click behaviour is handled in PageView (event delegation on the paper div)
 * so the mark itself has no runtime JS — it's pure CSS + HTML attrs.
 */

import { Mark, mergeAttributes } from '@tiptap/core'

export type LinkTargetKind = 'page' | 'folder' | 'atlas'

export interface InternalLinkAttrs {
  targetId:   string
  targetKind: LinkTargetKind
  targetName: string  // snapshot fallback
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    internalLink: {
      /** Apply an internal link mark to the current selection. */
      setInternalLink:   (attrs: InternalLinkAttrs) => ReturnType
      /** Remove the internal link mark from the current selection. */
      unsetInternalLink: () => ReturnType
    }
  }
}

export const InternalLinkExtension = Mark.create({
  name:        'internalLink',
  inclusive:   false,  // typing at the edge of the mark doesn't extend it
  excludes:    '_',    // one internal link per span (no nested links)
  spanning:    false,  // don't span across block boundaries

  addAttributes() {
    return {
      targetId:   { default: null },
      targetKind: { default: 'page' },
      targetName: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-internal-link]',
        getAttrs: (el) => {
          const e = el as HTMLElement
          return {
            targetId:   e.getAttribute('data-target-id'),
            targetKind: e.getAttribute('data-target-kind') ?? 'page',
            targetName: e.getAttribute('data-target-name') ?? '',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { targetId, targetKind, targetName } = HTMLAttributes as InternalLinkAttrs
    return [
      'span',
      mergeAttributes({
        'data-internal-link': 'true',
        'data-target-id':     targetId,
        'data-target-kind':   targetKind,
        'data-target-name':   targetName,
        'class':              'internal-link',
        'title':              targetName,
      }),
      0,  // hole — text content goes here
    ]
  },

  addCommands() {
    return {
      setInternalLink:   (attrs: InternalLinkAttrs) => ({ commands }) =>
        commands.setMark(this.name, attrs),
      unsetInternalLink: () => ({ commands }) =>
        commands.unsetMark(this.name),
    }
  },
})
