/**
 * useDirStore — in-memory state for folder/page entries inside a wiki.
 * All entries share one flat list; each entry has a parentId pointing to
 * either the wikiId (root) or another folderId (nested).
 */

import { create } from 'zustand'
import { sanitizeText } from '../utils/sanitize'

export type EntryKind = 'folder' | 'page' | 'atlas'

export interface DirEntry {
  id: string
  kind: EntryKind
  name: string
  colorHex: string   // folders: user-picked; pages: '#ffffff' default; atlas: default accent
  parentId: string   // wikiId = root, folderId = nested
  osPath: string     // full OS path: folder dir path or .json file path
  createdAt: string
  updatedAt: string
  coverImage?: string | null
  coverZoom?: number
  coverPanX?: number
  coverPanY?: number
}

interface DirState {
  entries: DirEntry[]
}

interface DirActions {
  addFolder: (name: string, colorHex: string, parentId: string, osPath: string) => DirEntry
  addPage: (name: string, parentId: string, osPath: string) => DirEntry
  addAtlas: (name: string, parentId: string, osPath: string) => DirEntry
  removeEntry: (id: string) => void
  renameEntry: (id: string, name: string) => void
  updateEntryColor: (id: string, colorHex: string) => void
  setEntryCover: (id: string, coverImage: string | null) => void
  setEntryCoverAdjustment: (id: string, zoom: number, panX: number, panY: number) => void
  getChildren: (parentId: string) => DirEntry[]
  /** Bulk-replace entries from disk on startup. */
  hydrate: (entries: DirEntry[]) => void
}

export const useDirStore = create<DirState & DirActions>((set, get) => ({
  entries: [],

  addFolder: (name, colorHex, parentId, osPath) => {
    const entry: DirEntry = {
      id: crypto.randomUUID(),
      kind: 'folder',
      name,
      colorHex,
      parentId,
      osPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      coverImage: null,
    }
    set((s) => ({ entries: [...s.entries, entry] }))
    return entry
  },

  addPage: (name, parentId, osPath) => {
    const entry: DirEntry = {
      id: crypto.randomUUID(),
      kind: 'page',
      name,
      colorHex: '#ffffff',
      parentId,
      osPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((s) => ({ entries: [...s.entries, entry] }))
    return entry
  },

  addAtlas: (name, parentId, osPath) => {
    const entry: DirEntry = {
      id: crypto.randomUUID(),
      kind: 'atlas',
      name,
      colorHex: '#3b82f6',
      parentId,
      osPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((s) => ({ entries: [...s.entries, entry] }))
    return entry
  },

  removeEntry: (id) =>
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

  renameEntry: (id, name) => {
    const safe = sanitizeText(name)
    if (!safe) return
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === id ? { ...e, name: safe, updatedAt: new Date().toISOString() } : e
      ),
    }))
  },

  updateEntryColor: (id, colorHex) =>
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === id ? { ...e, colorHex, updatedAt: new Date().toISOString() } : e
      ),
    })),

  setEntryCover: (id, coverImage) =>
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === id ? { ...e, coverImage, coverZoom: 1, coverPanX: 0, coverPanY: 0, updatedAt: new Date().toISOString() } : e
      ),
    })),

  setEntryCoverAdjustment: (id, zoom, panX, panY) =>
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === id ? { ...e, coverZoom: zoom, coverPanX: panX, coverPanY: panY, updatedAt: new Date().toISOString() } : e
      ),
    })),

  getChildren: (parentId) =>
    get().entries.filter((e) => e.parentId === parentId),

  hydrate: (entries) => set({ entries }),
}))
