/**
 * tiptapToRtf — converts a Tiptap JSON document to RTF (Rich Text Format).
 * RTF is natively opened by Word, Pages, LibreOffice — no dependencies required.
 * Supports: headings (H1–H3), paragraphs, bold, italic, underline, plain images.
 */

import type { JSONContent } from '@tiptap/core'

/** Escapes a raw string for RTF (handles non-ASCII and RTF control chars). */
function escRtf(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/[^\x00-\x7F]/g, (ch) => {
      const code = ch.charCodeAt(0)
      return `\\u${code}?`
    })
}

/** Converts inline nodes to RTF runs. */
function inlineToRtf(node: JSONContent): string {
  if (node.type === 'hardBreak') return '\\line '
  if (node.type !== 'text') return (node.content ?? []).map(inlineToRtf).join('')

  const raw = escRtf(node.text ?? '')
  const marks = node.marks ?? []
  const bold      = marks.some((m) => m.type === 'bold')
  const italic    = marks.some((m) => m.type === 'italic')
  const underline = marks.some((m) => m.type === 'underline')

  let out = raw
  if (bold)      out = `{\\b ${out}}`
  if (italic)    out = `{\\i ${out}}`
  if (underline) out = `{\\ul ${out}}`
  return out
}

/** Converts block nodes to RTF paragraph strings. */
function blockToRtf(node: JSONContent): string {
  switch (node.type) {
    case 'heading': {
      const level = node.attrs?.level ?? 1
      // H1 = 36pt bold, H2 = 28pt bold, H3 = 24pt bold
      const sizes: Record<number, number> = { 1: 72, 2: 56, 3: 48 }
      const fs = sizes[level] ?? 72
      const inner = (node.content ?? []).map(inlineToRtf).join('')
      return `\\pard\\sb240\\sa120{\\b\\fs${fs} ${inner}}\\par\n`
    }
    case 'paragraph': {
      const inner = (node.content ?? []).map(inlineToRtf).join('')
      return `\\pard\\sb0\\sa160\\fs36 ${inner}\\par\n`
    }
    case 'bulletList':
      return (node.content ?? [])
        .map((li) => {
          const inner = (li.content ?? []).map((p) =>
            (p.content ?? []).map(inlineToRtf).join('')
          ).join('')
          return `\\pard\\li360\\sb0\\sa80\\fs36 \\bullet  ${inner}\\par\n`
        })
        .join('')
    case 'orderedList':
      return (node.content ?? [])
        .map((li, i) => {
          const inner = (li.content ?? []).map((p) =>
            (p.content ?? []).map(inlineToRtf).join('')
          ).join('')
          return `\\pard\\li360\\sb0\\sa80\\fs36 ${i + 1}.  ${inner}\\par\n`
        })
        .join('')
    case 'image':
      return `\\pard\\sb120\\sa120\\fs36 [Image: ${escRtf(node.attrs?.alt ?? node.attrs?.src ?? '')}]\\par\n`
    default:
      return (node.content ?? []).map(blockToRtf).join('')
  }
}

/** Returns a complete RTF document string. */
export function tiptapToRtf(doc: JSONContent, title = 'Document'): string {
  const body = (doc.content ?? []).map(blockToRtf).join('')
  return [
    '{\\rtf1\\ansi\\deff0',
    '{\\fonttbl{\\f0\\froman\\fprq2 Times New Roman;}{\\f1\\fswiss\\fprq2 Arial;}}',
    '{\\info{\\title ' + escRtf(title) + '}}',
    '\\widowctrl\\hyphauto',
    body,
    '}',
  ].join('\n')
}
