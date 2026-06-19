/**
 * usePageViewStore — UI state for the Page View.
 * Tracks panel visibility and edit/preview mode.
 */

import { create } from 'zustand'

export type EditMode = 'edit' | 'preview'

interface PageViewState {
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  editMode: EditMode
}

interface PageViewActions {
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  setEditMode: (mode: EditMode) => void
  openBothPanels: () => void
}

export const usePageViewStore = create<PageViewState & PageViewActions>((set) => ({
  leftPanelOpen: true,
  rightPanelOpen: true,
  editMode: 'edit',

  toggleLeftPanel: () =>
    set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),

  toggleRightPanel: () =>
    set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),

  setEditMode: (mode) => set({ editMode: mode }),

  openBothPanels: () => set({ leftPanelOpen: true, rightPanelOpen: true }),
}))
