import type { ChartDrawingDto, SavedScreenDto, ScreenLayoutDto } from '@/shared/api/contracts'
import { SAVED_SCREEN_FIXTURES } from '../fixtures/screens'
import { WATCHLIST_FIXTURES, type WatchlistFixture } from '../fixtures/users'
import { currentAccount, userStore } from './session'
import { readStorage, writeStorage } from './storage'

/** Each user's own workspace: watchlists, saved screens, screen layouts and chart drawings. */

export type StoredWatchlist = WatchlistFixture

export const watchlistStore = userStore<StoredWatchlist[]>('watchlists', () =>
  WATCHLIST_FIXTURES.map((list) => ({
    ...list,
    columns: [...list.columns],
    securityIds: [...list.securityIds],
  })),
)

export const savedScreenStore = userStore<SavedScreenDto[]>('screens', () =>
  SAVED_SCREEN_FIXTURES.map((screen) => ({ ...screen, criteria: [...screen.criteria] })),
)

function layoutKey(screen: string): string {
  return `cmarket.prototype.layout.${currentAccount().id}.${screen}`
}

/** What the mock keeps of a screen's layout: all of it but the screen's id. */
export type StoredLayout = Omit<ScreenLayoutDto, 'screen'>

export function readLayout(screen: string): StoredLayout | undefined {
  const stored = readStorage(layoutKey(screen))
  if (!stored) return undefined
  try {
    const layout = JSON.parse(stored) as StoredLayout | StoredLayout['items']
    // Saved before panels could be hidden or layouts named: the positions alone.
    return Array.isArray(layout) ? { items: layout } : layout
  } catch {
    return undefined
  }
}

export function writeLayout(screen: string, layout: StoredLayout): void {
  writeStorage(layoutKey(screen), JSON.stringify(layout))
}

function drawingsKey(securityId: string): string {
  return `cmarket.prototype.drawings.${currentAccount().id}.${securityId}`
}

/** Chart drawings are saved per user (spec section 3). */
export function readDrawings(securityId: string): ChartDrawingDto[] {
  const stored = readStorage(drawingsKey(securityId))
  if (!stored) return []
  try {
    return JSON.parse(stored) as ChartDrawingDto[]
  } catch {
    return []
  }
}

export function writeDrawings(securityId: string, drawings: ChartDrawingDto[]): void {
  writeStorage(drawingsKey(securityId), JSON.stringify(drawings))
}
