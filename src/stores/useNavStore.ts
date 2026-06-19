/**
 * useNavStore — tracks navigation history for back-button labels.
 * Each view pushes its own label on mount. The back button reads
 * the previous entry to show "← Characters" instead of just "←".
 * Actual navigation is still handled by React Router.
 */

import { create } from 'zustand'

export interface NavEntry {
  path: string
  label: string
}

interface NavState {
  stack: NavEntry[]
}

interface NavActions {
  push: (entry: NavEntry) => void
  pop: () => void
  current: () => NavEntry | undefined
  previous: () => NavEntry | undefined
}

export const useNavStore = create<NavState & NavActions>((set, get) => ({
  stack: [],

  push: (entry) =>
    set((s) => {
      // Avoid duplicate consecutive pushes (e.g. strict mode double-mount)
      const top = s.stack[s.stack.length - 1]
      if (top?.path === entry.path) return s
      // Keep at most 30 entries
      const trimmed = s.stack.slice(-29)
      return { stack: [...trimmed, entry] }
    }),

  pop: () =>
    set((s) => ({ stack: s.stack.slice(0, -1) })),

  current: () => {
    const { stack } = get()
    return stack[stack.length - 1]
  },

  previous: () => {
    const { stack } = get()
    return stack[stack.length - 2]
  },
}))
