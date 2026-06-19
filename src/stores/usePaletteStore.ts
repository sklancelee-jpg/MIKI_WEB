/**
 * usePaletteStore — global custom color palette, persisted to AppData.
 * Stores up to 24 hex colors. Self-contained: reads/writes its own file.
 */

import { create }         from 'zustand'
import { ensureAppDataDir, readAppDataJson, writeAppDataJson } from '../services/db'
import { logError }       from '../utils/logger'

const PALETTE_FILE = 'palette.json'
const MAX_COLORS   = 24

let debounceTimer: ReturnType<typeof setTimeout> | null = null

interface PaletteState {
  colors: string[]
}

interface PaletteActions {
  addColor:    (hex: string) => void
  removeColor: (hex: string) => void
  hydrate:     (colors: string[]) => void
}

export const usePaletteStore = create<PaletteState & PaletteActions>((set, get) => ({
  colors: [],

  addColor: (hex) => {
    const norm = hex.toLowerCase()
    set((s) => ({
      colors: s.colors.includes(norm) ? s.colors : [...s.colors, norm].slice(-MAX_COLORS),
    }))
    scheduleSave(get)
  },

  removeColor: (hex) => {
    const norm = hex.toLowerCase()
    set((s) => ({ colors: s.colors.filter((c) => c !== norm) }))
    scheduleSave(get)
  },

  hydrate: (colors) => set({ colors }),
}))

function scheduleSave(get: () => PaletteState): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    writeAppDataJson(PALETTE_FILE, get().colors)
      .catch((err) => logError({ error_code: 'PALETTE_SAVE_FAILED', description: 'failed to persist color palette', context_payload: { err: String(err) } }))
  }, 400)
}

export async function loadPalette(): Promise<void> {
  await ensureAppDataDir()
  const colors = await readAppDataJson<string[]>(PALETTE_FILE)
  if (colors) usePaletteStore.getState().hydrate(colors)
}
