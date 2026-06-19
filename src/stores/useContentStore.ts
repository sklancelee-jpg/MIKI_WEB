/**
 * useContentStore — holds the saved Tiptap JSONContent for each page,
 * keyed by pageId. Populated on startup by dataLoader; updated whenever
 * PageView flushes a debounced save.
 */

import { create } from 'zustand'
import type { JSONContent } from '@tiptap/core'

interface ContentState {
  contents: Record<string, JSONContent>
}

interface ContentActions {
  /** Store (or overwrite) the content for a page. */
  setContent: (pageId: string, content: JSONContent) => void
  /** Retrieve stored content; null if the page has never been saved. */
  getContent: (pageId: string) => JSONContent | null
  /** Bulk-hydrate from disk on startup — replaces the entire map. */
  hydrate:    (data: Record<string, JSONContent>) => void
}

export const useContentStore = create<ContentState & ContentActions>(
  (set, get) => ({
    contents: {},

    setContent: (pageId, content) =>
      set((s) => ({ contents: { ...s.contents, [pageId]: content } })),

    getContent: (pageId) => get().contents[pageId] ?? null,

    hydrate: (data) => set({ contents: data }),
  }),
)
