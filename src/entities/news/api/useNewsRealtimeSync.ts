import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { newsKeys } from './queries'

/** NewsPublished refreshes the feeds. Mounted once by the app shell. */
export function useNewsRealtimeSync() {
  const queryClient = useQueryClient()
  useRealtimeEvent('NewsPublished', () => {
    void queryClient.invalidateQueries({ queryKey: newsKeys.all })
  })
}
