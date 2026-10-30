import type { WatchlistColumn } from '@/shared/api/contracts'

/** The optional columns of a watchlist, in the order the panel shows them. */
export const WATCHLIST_COLUMNS: readonly WatchlistColumn[] = [
  'name',
  'last',
  'change',
  'changePct',
  'volume',
  'sparkline',
]

/** Columns of a new list: those of the screen 1 mockup. */
export const DEFAULT_WATCHLIST_COLUMNS: readonly WatchlistColumn[] = [
  'last',
  'changePct',
  'volume',
  'sparkline',
]
