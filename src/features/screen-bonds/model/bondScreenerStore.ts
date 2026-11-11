import { create } from 'zustand'
import type { SavedBondScreenDto } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { defaultCriteria, fromSaved, type BondCriteria } from './criteria'

/** The year the maturities count from: this market day's. */
const THIS_YEAR = Number(toMarketDay(Date.now()).slice(0, 4))

interface BondScreenerState {
  /** The criteria being edited in the panel. */
  draft: BondCriteria
  /** The criteria of the last run, which the results show. */
  applied: BondCriteria
  /** The saved screen loaded, until the criteria change. */
  screenId: string | null
  /** The bond the lower panel shows (null: the first result). */
  bondId: string | null
  setDraft: (draft: BondCriteria) => void
  run: () => void
  /** Back to the mockup's screen, and runs. */
  reset: () => void
  /** Loads a saved screen and runs it. */
  load: (screen: SavedBondScreenDto) => void
  select: (bondId: string) => void
}

/** Lives outside the page, so the screen, its results and the bond survive a visit to DES. */
export const useBondScreenerStore = create<BondScreenerState>()((set, get) => ({
  draft: defaultCriteria(THIS_YEAR),
  applied: defaultCriteria(THIS_YEAR),
  screenId: null,
  bondId: null,
  setDraft: (draft) => set({ draft, screenId: null }),
  run: () => set({ applied: get().draft }),
  reset: () => {
    const draft = defaultCriteria(THIS_YEAR)
    set({ draft, applied: draft, screenId: null })
  },
  load: (screen) => {
    const criteria = fromSaved(screen.criteria)
    set({ draft: criteria, applied: criteria, screenId: screen.id })
  },
  select: (bondId) => set({ bondId }),
}))

export const thisYear = () => THIS_YEAR
