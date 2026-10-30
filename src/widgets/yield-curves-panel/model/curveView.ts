import { create } from 'zustand'
import { addDays, addMonths } from '@/shared/lib/isoDate'

/** "COMPARE TO" of the screen 4 mockup: a past date, counted back from the curves' date. */
export const COMPARE_OFFSETS = ['none', '1w', '1m', '3m', '1y'] as const
export type CompareOffset = (typeof COMPARE_OFFSETS)[number]

export function compareDate(date: string, offset: CompareOffset): string | null {
  switch (offset) {
    case 'none':
      return null
    case '1w':
      return addDays(date, -7)
    case '1m':
      return addMonths(date, -1)
    case '3m':
      return addMonths(date, -3)
    case '1y':
      return addMonths(date, -12)
  }
}

interface CurveViewState {
  /** Countries hidden by a click on their legend item. */
  hidden: readonly string[]
  compare: CompareOffset
  toggleCountry: (country: string) => void
  setCompare: (compare: CompareOffset) => void
}

/** Lives outside the panel, so the view survives going from YCRV to YAS and back. */
export const useCurveView = create<CurveViewState>()((set) => ({
  hidden: [],
  compare: '1m',
  toggleCountry: (country) =>
    set(({ hidden }) => ({
      hidden: hidden.includes(country)
        ? hidden.filter((value) => value !== country)
        : [...hidden, country],
    })),
  setCompare: (compare) => set({ compare }),
}))
