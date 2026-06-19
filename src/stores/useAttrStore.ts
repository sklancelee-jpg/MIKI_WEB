/**
 * useAttrStore — per-page attributes and cover image.
 * Keyed by pageId so each page has independent data.
 */

import { create } from 'zustand'
import { sanitizeText } from '../utils/sanitize'

export interface Attribute {
  id: string
  label: string
  value: string
}

export type HRStyle = 'solid' | 'dashed' | 'dotted' | 'double'

export interface PageStyle {
  borderColor:  string         // hex
  borderWidth:  number         // px, 0–8; 0 = no border
  borderStyle:  HRStyle | 'none'
  borderRadius: number         // px, 0–24; overrides default CSS radius
}

export interface PageData {
  attributes: Attribute[]
  coverImage: string | null    // base64 data URL
  pageStyle?: PageStyle
}

interface AttrState {
  pages: Record<string, PageData>
}

interface AttrActions {
  getPage:       (pageId: string) => PageData
  addAttr:       (pageId: string) => string   // returns new attr id
  updateAttr:    (pageId: string, id: string, patch: Partial<Pick<Attribute, 'label' | 'value'>>) => void
  removeAttr:    (pageId: string, id: string) => void
  setCoverImage: (pageId: string, dataUrl: string | null) => void
  setPageStyle:  (pageId: string, style: PageStyle | undefined) => void
  /** Bulk-replace all page data from disk on startup. */
  hydratePages:  (pages: Record<string, PageData>) => void
}

const emptyPage = (): PageData => ({ attributes: [], coverImage: null })

const ensurePage = (pages: Record<string, PageData>, pageId: string): PageData =>
  pages[pageId] ?? emptyPage()

export const useAttrStore = create<AttrState & AttrActions>((set, get) => ({
  pages: {},

  getPage: (pageId) => ensurePage(get().pages, pageId),

  addAttr: (pageId) => {
    const id = crypto.randomUUID()
    set((s) => {
      const page = ensurePage(s.pages, pageId)
      return {
        pages: {
          ...s.pages,
          [pageId]: {
            ...page,
            attributes: [...page.attributes, { id, label: '', value: '' }],
          },
        },
      }
    })
    return id
  },

  updateAttr: (pageId, id, patch) =>
    set((s) => {
      const page = ensurePage(s.pages, pageId)
      const sanitized: typeof patch = {}
      if (patch.label !== undefined) sanitized.label = sanitizeText(patch.label)
      if (patch.value !== undefined) sanitized.value = sanitizeText(patch.value)
      return {
        pages: {
          ...s.pages,
          [pageId]: {
            ...page,
            attributes: page.attributes.map((a) =>
              a.id === id ? { ...a, ...sanitized } : a
            ),
          },
        },
      }
    }),

  removeAttr: (pageId, id) =>
    set((s) => {
      const page = ensurePage(s.pages, pageId)
      return {
        pages: {
          ...s.pages,
          [pageId]: {
            ...page,
            attributes: page.attributes.filter((a) => a.id !== id),
          },
        },
      }
    }),

  setCoverImage: (pageId, dataUrl) =>
    set((s) => {
      const page = ensurePage(s.pages, pageId)
      return { pages: { ...s.pages, [pageId]: { ...page, coverImage: dataUrl } } }
    }),

  setPageStyle: (pageId, style) =>
    set((s) => {
      const page = ensurePage(s.pages, pageId)
      return { pages: { ...s.pages, [pageId]: { ...page, pageStyle: style } } }
    }),

  hydratePages: (pages) => set({ pages }),
}))
