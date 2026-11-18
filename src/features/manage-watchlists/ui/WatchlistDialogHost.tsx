import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { useWatchlistDialog } from '@/entities/watchlist'
import { WatchlistDialog } from './WatchlistDialog'

/** The list form asked for from anywhere (openWatchlistDialog). Mounted once, by the app shell. */
export function WatchlistDialogHost() {
  const request = useWatchlistDialog((state) => state.request)
  const close = useWatchlistDialog((state) => state.close)
  // The watchlist form, mounted by the app shell, closes when the screen changes: Back from ALRT left it
  // open over MKT (B47).
  const { pathname } = useLocation()
  const shown = useRef(pathname)
  useEffect(() => {
    if (pathname === shown.current) return
    shown.current = pathname
    close()
  }, [pathname, close])
  return <WatchlistDialog request={request} onClose={close} />
}
