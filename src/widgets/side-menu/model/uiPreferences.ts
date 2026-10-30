import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiPreferences {
  /** Left menu: 56 px collapsed, 200 px expanded (spec section 8). */
  menuExpanded: boolean
  toggleMenu: () => void
}

export const useUiPreferences = create<UiPreferences>()(
  persist(
    (set) => ({
      menuExpanded: false,
      toggleMenu: () => set((state) => ({ menuExpanded: !state.menuExpanded })),
    }),
    { name: 'cmarket.ui' },
  ),
)
