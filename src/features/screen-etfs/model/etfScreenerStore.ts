import { create } from 'zustand'
import type { SavedEtfScreenDto } from '@/shared/api/contracts'
import { defaultCriteria, fromSaved, type EtfCriteria } from './criteria'

interface EtfScreenerState {
  /** The criteria being edited in the panel. */
  draft: EtfCriteria
  /** The criteria of the last run, which the results show. */
  applied: EtfCriteria
  /** The saved screen loaded, until the criteria change. */
  screenId: string | null
  /** The ETF the lower panel shows (null: the first result). */
  etfId: string | null
  setDraft: (draft: EtfCriteria) => void
  run: () => void
  /** Back to the mockup's screen, and runs (as BS). */
  reset: () => void
  /** Loads a saved screen and runs it. */
  load: (screen: SavedEtfScreenDto) => void
  select: (etfId: string) => void
}

/** Lives outside the page, so the screen, its results and the ETF survive a visit to DES. */
export const useEtfScreenerStore = create<EtfScreenerState>()((set, get) => ({
  draft: defaultCriteria(),
  applied: defaultCriteria(),
  screenId: null,
  etfId: null,
  setDraft: (draft) => set({ draft, screenId: null }),
  run: () => set({ applied: get().draft }),
  reset: () => {
    const draft = defaultCriteria()
    set({ draft, applied: draft, screenId: null })
  },
  load: (screen) => {
    const criteria = fromSaved(screen.criteria)
    set({ draft: criteria, applied: criteria, screenId: screen.id })
  },
  select: (etfId) => set({ etfId }),
}))
