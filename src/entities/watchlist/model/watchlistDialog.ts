import { create } from 'zustand'
import type { WatchlistDto } from '@/shared/api/contracts'

/** A new list, possibly with its first securities, or the settings of an existing list. */
export type WatchlistDialogRequest =
  | { mode: 'create'; securities?: { id: string; code: string }[] }
  | { mode: 'edit'; watchlist: WatchlistDto }

interface WatchlistDialogState {
  request: WatchlistDialogRequest | null
  close: () => void
}

/**
 * The list form opened from anywhere, e.g. "New list…" in the right-click menu of a security. The
 * app shell shows the form; this store only says what to show.
 */
export const useWatchlistDialog = create<WatchlistDialogState>()((set) => ({
  request: null,
  close: () => set({ request: null }),
}))

export function openWatchlistDialog(request: WatchlistDialogRequest): void {
  useWatchlistDialog.setState({ request })
}
