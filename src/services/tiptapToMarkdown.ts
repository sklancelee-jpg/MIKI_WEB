/**
 * tiptapToMarkdown — converts a Tiptap JSON document to Markdown.
 * Supports: headings, paragraphs, bold, italic, underline, images,
 * bullet/ordered lists, hard breaks.
 */

import type { JSONContent } from '@tiptap/core'

/** Converts an inline node (text + marks) to Markdown. */
function inlineToMd(node: JSONContent): string {
  if (node.type === 'hardBreak') return '  \n'
  if (node.type !== 'text') return (node.content ?? []).map(inlineToMd).join('')

  let text = node.text ?? ''
  const marks = node.marks ?? []

  if (marks.some((m) => m.type === 'code'))      return `\`${text}\``
  if (marks.some((m) => m.type === 'bold'))       text = `**${text}**`
  if (marks.some((m) => m.type === 'italic'))     text = `_${text}_`
  if (marks.some((m) => m.type === 'underline'))  text = `<u>${text}</u>`
  return text
}

/** Converts a block node to a Markdown string. */
function blockToMd(node: JSONContent): string {
  switch (node.type) {
    case 'heading': {
      const prefix = '#'.repeat(node.attrs?.level ?? 1)
      const text = (node.content ?? []).map(inlineToMd).join('')
      return `${prefix} ${text}\n\n`
    }
    case 'paragraph': {
      const text = (node.content ?? []).map(inlineToMd).join('')
      return `${text}\n\n`
    }
    case 'image': {
      const src = node.attrs?.src ?? ''
      const alt = node.attrs?.alt ?? 'image'
      return `![${alt}](${src})\n\n`
    }
    case 'bulletList':
      return (node.content ?? [])
        .map((li) => {
          const inner = (li.content ?? []).map((p) =>
            (p.content ?? []).map(inlineToMd).join('')
          ).join('')
          return `- ${inner}`
        })
        .join('\n') + '\n\n'
    case 'orderedList':
      return (node.content ?? [])
        .map((li, i) => {
          const inner = (li.content ?? []).map((p) =>
            (p.content ?? []).map(inlineToMd).join('')
          ).join('')
          return `${i + 1}. ${inner}`
        })
        .join('\n') + '\n\n'
    default:
      return (node.content ?? []).map(blockToMd).join('')
  }
}

/** Returns the document as a trimmed Markdown string. */
export function tiptapToMarkdown(doc: JSONContent): string {
  return (doc.content ?? []).map(blockToMd).join('').trim()
}
