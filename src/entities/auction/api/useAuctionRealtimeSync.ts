import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { auctionKeys } from './queries'

/** A BEAC auctions file published or rolled back (screen 6). Mounted once by the app shell. */
export function useAuctionRealtimeSync() {
  const queryClient = useQueryClient()
  useRealtimeEvent('DataPublished', ({ type }) => {
    if (type === 'auctions') void queryClient.invalidateQueries({ queryKey: auctionKeys.all })
  })
}
