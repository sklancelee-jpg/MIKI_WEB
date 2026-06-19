/**
 * useWikiStore — global state for the wiki list on the Home view.
 */

import { create } from 'zustand'
import { sanitizeText } from '../utils/sanitize'

export interface Wiki {
  id: string
  name: string
  colorHex: string
  rootPath: string   // disk path — assigned when FS layer lands in Phase 2b
  createdAt: string
  coverImage?: string | null
  coverZoom?: number
  coverPanX?: number
  coverPanY?: number
}

interface WikiState {
  wikis: Wiki[]
}

interface WikiActions {
  addWiki: (name: string, colorHex: string, rootPath: string) => Wiki
  removeWiki: (id: string) => void
  renameWiki: (id: string, name: string) => void
  updateWikiColor: (id: string, colorHex: string) => void
  setWikiCover: (id: string, coverImage: string | null) => void
  setWikiCoverAdjustment: (id: string, zoom: number, panX: number, panY: number) => void
  /** Bulk-replace wikis from disk on startup. */
  hydrate: (wikis: Wiki[]) => void
}

export const useWikiStore = create<WikiState & WikiActions>((set) => ({
  wikis: [],

  addWiki: (name, colorHex, rootPath) => {
    const wiki: Wiki = {
      id: crypto.randomUUID(),
      name: sanitizeText(name) || name,
      colorHex,
      rootPath,
      createdAt: new Date().toISOString(),
      coverImage: null,
      coverZoom: 1,
      coverPanX: 0,
      coverPanY: 0,
    }
    set((state) => ({ wikis: [...state.wikis, wiki] }))
    return wiki
  },

  removeWiki: (id) =>
    set((state) => ({ wikis: state.wikis.filter((w) => w.id !== id) })),

  renameWiki: (id, name) => {
    const safe = sanitizeText(name)
    if (!safe) return
    set((state) => ({
      wikis: state.wikis.map((w) => (w.id === id ? { ...w, name: safe } : w)),
    }))
  },

  updateWikiColor: (id, colorHex) =>
    set((state) => ({
      wikis: state.wikis.map((w) => (w.id === id ? { ...w, colorHex } : w)),
    })),

  setWikiCover: (id, coverImage) =>
    set((state) => ({
      wikis: state.wikis.map((w) => (w.id === id ? { ...w, coverImage, coverZoom: 1, coverPanX: 0, coverPanY: 0 } : w)),
    })),

  setWikiCoverAdjustment: (id, zoom, panX, panY) =>
    set((state) => ({
      wikis: state.wikis.map((w) => (w.id === id ? { ...w, coverZoom: zoom, coverPanX: panX, coverPanY: panY } : w)),
    })),

  hydrate: (wikis) => set({ wikis }),
}))
