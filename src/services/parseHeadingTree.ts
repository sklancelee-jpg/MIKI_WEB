/**
 * parseHeadingTree — derives a flat TocItem list from Tiptap's JSON AST.
 * Called on every editor update to keep the Left Panel ToC in sync.
 */

import type { JSONContent } from '@tiptap/core'
import type { TocItem } from '../ui/components/panels/LeftPanel'

export function parseHeadingTree(doc: JSONContent | null | undefined): TocItem[] {
  if (!doc) return []

  const items: TocItem[] = []

  const traverse = (node: JSONContent) => {
    if (node.type === 'heading') {
      const level = (node.attrs?.level ?? 1) as 1 | 2 | 3
      if (level >= 1 && level <= 3) {
        const text = (node.content ?? [])
          .filter((n) => n.type === 'text')
          .map((n) => n.text ?? '')
          .join('')
          .trim()

        if (text) {
          items.push({
            // Stable ID: level + sequential index so ToC links scroll correctly
            id: `toc-h${level}-${items.length}`,
            level,
            text,
          })
        }
      }
    }
    ;(node.content ?? []).forEach(traverse)
  }

  ;(doc.content ?? []).forEach(traverse)
  return items
}
