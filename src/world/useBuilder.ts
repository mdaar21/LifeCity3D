import { create } from 'zustand'
import type { DraftPlacement } from './building'

interface BuilderState {
  draft: DraftPlacement | null
  past: DraftPlacement[]
  future: DraftPlacement[]
  begin: (draft: DraftPlacement) => void
  edit: (patch: Partial<Pick<DraftPlacement, 'x' | 'z' | 'rotation'>>) => void
  undo: () => void
  redo: () => void
  clear: () => void
}

export const useBuilder = create<BuilderState>((set) => ({
  draft: null,
  past: [],
  future: [],
  begin: draft => set({ draft, past: [], future: [] }),
  edit: patch => set(state => {
    if (!state.draft) return {}
    const next = { ...state.draft, ...patch }
    if (next.x === state.draft.x && next.z === state.draft.z && next.rotation === state.draft.rotation) return {}
    return { draft: next, past: [...state.past.slice(-29), state.draft], future: [] }
  }),
  undo: () => set(state => state.draft && state.past.length ? ({ draft: state.past[state.past.length - 1], past: state.past.slice(0, -1), future: [state.draft, ...state.future] }) : {}),
  redo: () => set(state => state.draft && state.future.length ? ({ draft: state.future[0], past: [...state.past, state.draft], future: state.future.slice(1) }) : {}),
  clear: () => set({ draft: null, past: [], future: [] }),
}))
