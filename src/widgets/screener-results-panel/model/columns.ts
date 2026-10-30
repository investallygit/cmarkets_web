import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Columns a user can show next to the security code (spec section 9: "configurable"). */
export const RESULT_COLUMNS = [
  'name',
  'sector',
  'country',
  'marketCap',
  'last',
  'pe',
  'dividendYield',
  'priceToBook',
  'roe',
  'netMargin',
  'netDebtToEquity',
  'revenueGrowth',
  'beta',
  'change1y',
  'changePct',
] as const
export type ResultColumn = (typeof RESULT_COLUMNS)[number]

/** The columns of the screen 3 mockup. */
const DEFAULT_COLUMNS: readonly ResultColumn[] = [
  'sector',
  'country',
  'marketCap',
  'pe',
  'dividendYield',
  'roe',
  'netDebtToEquity',
  'changePct',
]

interface ResultColumnsState {
  columns: readonly ResultColumn[]
  toggle: (column: ResultColumn) => void
}

/** Kept in the browser: the API has no place for it yet. */
export const useResultColumns = create<ResultColumnsState>()(
  persist(
    (set) => ({
      columns: DEFAULT_COLUMNS,
      toggle: (column) =>
        set(({ columns }) => ({
          columns: columns.includes(column)
            ? columns.filter((value) => value !== column)
            : RESULT_COLUMNS.filter((value) => value === column || columns.includes(value)),
        })),
    }),
    {
      name: 'cmarket.eqs.columns',
      // Columns saved by an older version may no longer exist.
      merge: (persisted, current) => ({
        ...current,
        columns: RESULT_COLUMNS.filter((column) =>
          (
            (persisted as Partial<ResultColumnsState> | undefined)?.columns ?? current.columns
          ).includes(column),
        ),
      }),
    },
  ),
)
