import { create } from 'zustand'

interface ScreenerSelectionState {
  /** Row shown in the lower panels (null: the first result). */
  securityId: string | null
  select: (securityId: string) => void
}

/** Lives outside the page, so the selection survives a visit to DES. */
export const useScreenerSelection = create<ScreenerSelectionState>()((set) => ({
  securityId: null,
  select: (securityId) => set({ securityId }),
}))
