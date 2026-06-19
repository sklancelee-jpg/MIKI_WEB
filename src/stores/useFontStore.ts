/**
 * useFontStore — global custom font library, persisted to AppData.
 * Stores font metadata only; binary font files live in AppData/miki-data/fonts/.
 */

import { create }         from 'zustand'
import { ensureAppDataDir, readAppDataJson, writeAppDataJson } from '../services/db'
import { logError }       from '../utils/logger'

const FONTS_META_FILE = 'fonts.json'

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export type FontFormat = 'woff2' | 'woff' | 'ttf' | 'otf'

export interface FontEntry {
  id:       string
  name:     string      // CSS font-family value
  filename: string      // e.g. "MyFont.woff2" — stored under miki-data/fonts/
  format:   FontFormat
}

interface FontState {
  fonts: FontEntry[]
}

interface FontActions {
  addFont:    (entry: FontEntry) => void
  removeFont: (id: string) => void
  hydrate:    (fonts: FontEntry[]) => void
}

export const useFontStore = create<FontState & FontActions>((set, get) => ({
  fonts: [],

  addFont: (entry) => {
    set((s) => ({ fonts: [...s.fonts.filter((f) => f.id !== entry.id), entry] }))
    scheduleSave(get)
  },

  removeFont: (id) => {
    set((s) => ({ fonts: s.fonts.filter((f) => f.id !== id) }))
    scheduleSave(get)
  },

  hydrate: (fonts) => set({ fonts }),
}))

function scheduleSave(get: () => FontState): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    writeAppDataJson(FONTS_META_FILE, get().fonts)
      .catch((err) => logError({ error_code: 'FONTS_SAVE_FAILED', description: 'failed to persist fonts metadata', context_payload: { err: String(err) } }))
  }, 400)
}

export async function loadFontsMeta(): Promise<void> {
  await ensureAppDataDir()
  const fonts = await readAppDataJson<FontEntry[]>(FONTS_META_FILE)
  if (fonts) useFontStore.getState().hydrate(fonts)
}
