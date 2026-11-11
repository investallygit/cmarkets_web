import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { bondKeys } from './queries'
import { bondScreenerKeys } from './screener'

/** What moves the bonds' daily figures (spec section 11): their list, ratings, prices and curves. */
const BOND_INPUTS = new Set([
  'bond-master',
  'bond-ratings',
  'daily-prices',
  'history',
  'auctions',
  'curves',
  'correction',
])

/** A publication of IMP refreshes BS and, for a bond list, the bonds of YAS. Mounted once by the app shell. */
export function useBondScreenerRealtimeSync() {
  const queryClient = useQueryClient()
  useRealtimeEvent('DataPublished', ({ type }) => {
    if (!BOND_INPUTS.has(type)) return
    void queryClient.invalidateQueries({ queryKey: bondScreenerKeys.all })
    if (type === 'bond-master') void queryClient.invalidateQueries({ queryKey: bondKeys.list() })
  })
}
