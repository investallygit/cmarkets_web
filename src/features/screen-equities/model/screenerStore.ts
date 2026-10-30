import { create } from 'zustand'
import type { SavedScreenDto, ScreenerCriterionDto } from '@/shared/api/contracts'
import {
  defaultCriteria,
  fromRequestCriteria,
  toRequestCriteria,
  type CriterionState,
} from './criteria'

interface ScreenerState {
  /** The criteria being edited in the panel. */
  draft: CriterionState[]
  /** The criteria of the last run, which the results show. */
  applied: ScreenerCriterionDto[]
  /** The saved screen loaded, until the criteria change. */
  screenId: string | null
  setDraft: (draft: CriterionState[]) => void
  run: () => void
  /** Back to every equity of BVMAC, and runs. */
  reset: () => void
  /** Loads a saved screen and runs it. */
  load: (screen: SavedScreenDto) => void
}

/** Lives outside the page, so the screen and its results survive a visit to DES. */
export const useScreenerStore = create<ScreenerState>()((set, get) => ({
  draft: defaultCriteria(),
  applied: toRequestCriteria(defaultCriteria()),
  screenId: null,
  setDraft: (draft) => set({ draft, screenId: null }),
  run: () => set({ applied: toRequestCriteria(get().draft) }),
  reset: () => {
    const draft = defaultCriteria()
    set({ draft, applied: toRequestCriteria(draft), screenId: null })
  },
  load: (screen) =>
    set({
      draft: fromRequestCriteria(screen.criteria),
      applied: screen.criteria,
      screenId: screen.id,
    }),
}))

/** The criteria of the last run, for the results and the lower panels. */
export function useAppliedCriteria(): ScreenerCriterionDto[] {
  return useScreenerStore((state) => state.applied)
}
