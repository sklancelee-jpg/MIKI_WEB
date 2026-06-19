/**
 * tiptapToText — converts a Tiptap JSON document to plain text.
 * Used by exportService for TXT export.
 */

import type { JSONContent } from '@tiptap/core'

function nodeToText(node: JSONContent): string {
  // Leaf text node
  if (node.type === 'text') return node.text ?? ''

  const children = (node.content ?? []).map(nodeToText).join('')

  switch (node.type) {
    case 'heading':
    case 'paragraph':
    case 'listItem':
      return children + '\n\n'
    case 'hardBreak':
      return '\n'
    case 'bulletList':
    case 'orderedList':
      return children.trimEnd() + '\n\n'
    case 'image':
      return `[Image: ${node.attrs?.alt ?? node.attrs?.src ?? ''}]\n\n`
    default:
      return children
  }
}

/** Returns the full document as trimmed plain text. */
export function tiptapToText(doc: JSONContent): string {
  return nodeToText(doc).trim()
}
