import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { yieldCurveKeys } from './queries'

/** Auctions and curves files place the points of the curves. Mounted once by the app shell. */
export function useYieldCurveRealtimeSync() {
  const queryClient = useQueryClient()
  useRealtimeEvent('DataPublished', ({ type }) => {
    if (type === 'auctions' || type === 'curves') {
      void queryClient.invalidateQueries({ queryKey: yieldCurveKeys.all })
    }
  })
}
