import { create } from 'zustand'

interface MarketSelectionState {
  /** Index shown in the dashboard's central chart (null: the first index). */
  indexCode: string | null
  selectIndex: (code: string) => void
}

export const useMarketSelection = create<MarketSelectionState>()((set) => ({
  indexCode: null,
  selectIndex: (indexCode) => set({ indexCode }),
}))
