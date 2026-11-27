import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { debtKeys } from './queries'

/**
 * The files whose publication moves DEBT (screen 35): the auction results, the bond list, the
 * prices and curves the yields come from, a correction, the sovereign ratings.
 */
const DEBT_FILES = new Set([
  'auctions',
  'bond-master',
  'daily-prices',
  'history',
  'curves',
  'cemac-sov-yields',
  'correction',
  'sovereign-ratings',
])

/**
 * One of DEBT's files published or rolled back, or an auction result published: every DEBT query
 * reads again. Mounted once by the app shell.
 */
export function useDebtRealtimeSync() {
  const queryClient = useQueryClient()
  const refresh = () => void queryClient.invalidateQueries({ queryKey: debtKeys.all })
  useRealtimeEvent('DataPublished', ({ type }) => {
    if (DEBT_FILES.has(type)) refresh()
  })
  useRealtimeEvent('AuctionResultPublished', refresh)
}
