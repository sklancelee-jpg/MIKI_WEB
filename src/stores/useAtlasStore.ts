/**
 * useAtlasStore — holds in-memory configuration for spatial atlases,
 * including their background image path, pin coordinates, and text boxes.
 */

import { create } from 'zustand'

export interface Pin {
  id: string
  label: string
  x: number // percentage (0-100)
  y: number // percentage (0-100)
  targetId: string // linked page/folder/atlas ID
  colorHex: string
}

export interface TextBox {
  id: string
  text: string
  x: number // percentage (0-100)
  y: number // percentage (0-100)
  width: number // px
  height: number // px
  fontFamily: string
  fontSize: number // px
  bold: boolean
  italic: boolean
  underline: boolean
  colorHex: string
}

export interface AtlasData {
  imagePath: string // relative under wiki root
  pins: Pin[]
  textBoxes?: TextBox[]
}

interface AtlasState {
  atlases: Record<string, AtlasData>
}

interface AtlasActions {
  getAtlas: (atlasId: string) => AtlasData
  setAtlasImage: (atlasId: string, imagePath: string) => void
  addPin: (atlasId: string, label: string, x: number, y: number, targetId: string, colorHex: string) => Pin
  updatePin: (atlasId: string, pinId: string, patch: Partial<Omit<Pin, 'id'>>) => void
  removePin: (atlasId: string, pinId: string) => void
  
  // Text Box Actions
  addTextBox: (atlasId: string, x: number, y: number) => TextBox
  updateTextBox: (atlasId: string, boxId: string, patch: Partial<Omit<TextBox, 'id'>>) => void
  removeTextBox: (atlasId: string, boxId: string) => void
  
  hydrate: (data: Record<string, AtlasData>) => void
}

const defaultAtlas = (): AtlasData => ({
  imagePath: '',
  pins: [],
  textBoxes: [],
})

export const useAtlasStore = create<AtlasState & AtlasActions>((set, get) => ({
  atlases: {},

  getAtlas: (atlasId) => {
    const atlas = get().atlases[atlasId] ?? defaultAtlas()
    // Return a new object rather than mutating the stored atlas
    return { ...atlas, textBoxes: atlas.textBoxes ?? [] }
  },

  setAtlasImage: (atlasId, imagePath) =>
    set((s) => {
      const atlas = s.atlases[atlasId] ?? defaultAtlas()
      return {
        atlases: {
          ...s.atlases,
          [atlasId]: { ...atlas, imagePath },
        },
      }
    }),

  addPin: (atlasId, label, x, y, targetId, colorHex) => {
    const pin: Pin = {
      id: crypto.randomUUID(),
      label,
      x,
      y,
      targetId,
      colorHex,
    }
    set((s) => {
      const atlas = s.atlases[atlasId] ?? defaultAtlas()
      return {
        atlases: {
          ...s.atlases,
          [atlasId]: {
            ...atlas,
            pins: [...(atlas.pins ?? []), pin],
          },
        },
      }
    })
    return pin
  },

  updatePin: (atlasId, pinId, patch) =>
    set((s) => {
      const atlas = s.atlases[atlasId]
      if (!atlas) return {}
      return {
        atlases: {
          ...s.atlases,
          [atlasId]: {
            ...atlas,
            pins: (atlas.pins ?? []).map((p) => (p.id === pinId ? { ...p, ...patch } : p)),
          },
        },
      }
    }),

  removePin: (atlasId, pinId) =>
    set((s) => {
      const atlas = s.atlases[atlasId]
      if (!atlas) return {}
      return {
        atlases: {
          ...s.atlases,
          [atlasId]: {
            ...atlas,
            pins: (atlas.pins ?? []).filter((p) => p.id !== pinId),
          },
        },
      }
    }),

  addTextBox: (atlasId, x, y) => {
    const box: TextBox = {
      id: crypto.randomUUID(),
      text: 'Double click to edit text',
      x,
      y,
      width: 180,
      height: 80,
      fontFamily: 'inherit',
      fontSize: 18,
      bold: false,
      italic: false,
      underline: false,
      colorHex: '#ffffff',
    }
    set((s) => {
      const atlas = s.atlases[atlasId] ?? defaultAtlas()
      return {
        atlases: {
          ...s.atlases,
          [atlasId]: {
            ...atlas,
            textBoxes: [...(atlas.textBoxes ?? []), box],
          },
        },
      }
    })
    return box
  },

  updateTextBox: (atlasId, boxId, patch) =>
    set((s) => {
      const atlas = s.atlases[atlasId]
      if (!atlas) return {}
      return {
        atlases: {
          ...s.atlases,
          [atlasId]: {
            ...atlas,
            textBoxes: (atlas.textBoxes ?? []).map((b) => (b.id === boxId ? { ...b, ...patch } : b)),
          },
        },
      }
    }),

  removeTextBox: (atlasId, boxId) =>
    set((s) => {
      const atlas = s.atlases[atlasId]
      if (!atlas) return {}
      return {
        atlases: {
          ...s.atlases,
          [atlasId]: {
            ...atlas,
            textBoxes: (atlas.textBoxes ?? []).filter((b) => b.id !== boxId),
          },
        },
      }
    }),

  hydrate: (data) => {
    // Ensure all hydrated atlases have a textBoxes array
    const normalized: Record<string, AtlasData> = {}
    Object.keys(data).forEach((id) => {
      normalized[id] = {
        ...data[id],
        pins: data[id].pins ?? [],
        textBoxes: data[id].textBoxes ?? [],
      }
    })
    set({ atlases: normalized })
  },
}))
