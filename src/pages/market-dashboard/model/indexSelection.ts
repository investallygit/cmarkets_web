import { create } from 'zustand'

interface IndexSelectionState {
  /** Index shown in the dashboard's central chart (null: the first index). */
  indexCode: string | null
  selectIndex: (code: string) => void
}

/** Lives outside the page, so the choice survives a visit to another screen. */
export const useIndexSelection = create<IndexSelectionState>()((set) => ({
  indexCode: null,
  selectIndex: (indexCode) => set({ indexCode }),
}))
