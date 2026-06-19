/**
 * slashItems — all commands available in the slash menu.
 * Each item has an icon, display title, description, group, and command.
 * Groups control the section headers shown in SlashMenu.
 */

import React from 'react'
import type { Editor, Range } from '@tiptap/core'
import {
  QuoteIcon,
  CodeIcon,
  DividerIcon,
  InfoIcon,
  ImageIcon,
} from '../shared/Icons'

export interface SlashItem {
  icon:        React.ReactNode
  title:       string
  description: string
  group:       string
  command:     (params: { editor: Editor; range: Range }) => void
}

export const SLASH_ITEMS: SlashItem[] = [
  // ── Text ────────────────────────────────────────────────────
  {
    icon: <span className="slash-menu__text-glyph">H1</span>,
    title: 'Heading 1',
    description: 'Large section heading',
    group: 'Text',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    icon: <span className="slash-menu__text-glyph">H2</span>,
    title: 'Heading 2',
    description: 'Medium heading',
    group: 'Text',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    icon: <span className="slash-menu__text-glyph">H3</span>,
    title: 'Heading 3',
    description: 'Small heading',
    group: 'Text',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    icon: <span className="slash-menu__text-glyph">¶</span>,
    title: 'Text',
    description: 'Plain paragraph',
    group: 'Text',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },

  // ── Lists ────────────────────────────────────────────────────
  {
    icon: <span className="slash-menu__text-glyph">•</span>,
    title: 'Bullet List',
    description: 'Unordered list',
    group: 'Lists',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    icon: <span className="slash-menu__text-glyph">1.</span>,
    title: 'Numbered List',
    description: 'Ordered list',
    group: 'Lists',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },

  // ── Blocks ───────────────────────────────────────────────────
  {
    icon: <QuoteIcon size={16} />,
    title: 'Quote',
    description: 'Callout blockquote',
    group: 'Blocks',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    icon: <CodeIcon size={16} />,
    title: 'Code Block',
    description: 'Monospace code block',
    group: 'Blocks',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    icon: <DividerIcon size={16} />,
    title: 'Divider',
    description: 'Horizontal separator rule',
    group: 'Blocks',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setStyledHR().run(),
  },
  {
    icon: <InfoIcon size={16} />,
    title: 'Callout Box',
    description: 'Highlight text in a styled container',
    group: 'Blocks',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCallout({ type: 'info', emoji: '💡' }).run(),
  },

  // ── Media ────────────────────────────────────────────────────
  {
    icon: <ImageIcon size={16} />,
    title: 'Image',
    description: 'Insert image from URL',
    group: 'Media',
    command: ({ editor, range }) => {
      const url = window.prompt('Image URL')
      if (url?.trim()) {
        editor.chain().focus().deleteRange(range).setImage({ src: url.trim() }).run()
      } else {
        editor.chain().focus().deleteRange(range).run()
      }
    },
  },
]

export const getSlashItems = (query: string): SlashItem[] => {
  const q = query.toLowerCase()
  if (!q) return SLASH_ITEMS
  return SLASH_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q)
  )
}
