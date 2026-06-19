/**
 * exportService — dispatches page export to the correct format handler.
 *
 * TXT / MD / RTF: browser blob download (no Tauri API needed).
 * PDF:            window.print() — triggers the native print/save-as-PDF dialog.
 *                 A @media print stylesheet in global.css hides everything
 *                 except .scriptorium__paper.
 */

import type { JSONContent } from '@tiptap/core'
import { tiptapToText }     from './tiptapToText'
import { tiptapToMarkdown } from './tiptapToMarkdown'
import { tiptapToRtf }      from './tiptapToRtf'

export type ExportFormat = 'pdf' | 'rtf' | 'txt' | 'md'

interface ExportOptions {
  format:   ExportFormat
  pageName: string
  doc:      JSONContent
}

/** Triggers a browser download for text-based formats. */
function downloadText(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Sanitises a page name for use in a filename. */
function toFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'page'
}

/**
 * Export a page.
 * Call this from ToolbarRight with the editor's JSON and the page name.
 */
export function exportPage({ format, pageName, doc }: ExportOptions): void {
  const base = toFilename(pageName)

  switch (format) {
    case 'txt': {
      const text = tiptapToText(doc)
      downloadText(text, `${base}.txt`, 'text/plain;charset=utf-8')
      break
    }
    case 'md': {
      const md = tiptapToMarkdown(doc)
      downloadText(md, `${base}.md`, 'text/markdown;charset=utf-8')
      break
    }
    case 'rtf': {
      const rtf = tiptapToRtf(doc, pageName)
      downloadText(rtf, `${base}.rtf`, 'application/rtf;charset=utf-8')
      break
    }
    case 'pdf': {
      // The @media print CSS in global.css hides everything except
      // .scriptorium__paper, so only the page content prints.
      window.print()
      break
    }
    default:
      break
  }
}
