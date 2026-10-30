import { useWatchlistDialog } from '@/entities/watchlist'
import { WatchlistDialog } from './WatchlistDialog'

/** The list form asked for from anywhere (openWatchlistDialog). Mounted once, by the app shell. */
export function WatchlistDialogHost() {
  const request = useWatchlistDialog((state) => state.request)
  const close = useWatchlistDialog((state) => state.close)
  return <WatchlistDialog request={request} onClose={close} />
}
