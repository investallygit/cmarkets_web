import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { auctionKeys } from './queries'

/** The file types that change the auctions (screen 6): the results and the Treasuries' calendars. */
const AUCTION_FILES = new Set(['auctions', 'auction-calendar'])

/**
 * A BEAC auctions file published or rolled back (screen 6), or results published (AUC, sixth
 * version): every auction query reads again. Mounted once by the app shell.
 */
export function useAuctionRealtimeSync() {
  const queryClient = useQueryClient()
  const refresh = () => void queryClient.invalidateQueries({ queryKey: auctionKeys.all })
  useRealtimeEvent('DataPublished', ({ type }) => {
    if (AUCTION_FILES.has(type)) refresh()
  })
  useRealtimeEvent('AuctionResultPublished', refresh)
}
