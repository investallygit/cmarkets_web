import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { securityKeys } from './queries'

/** DataPublished: a data import changed prices or reference data. Mounted once by the app shell. */
export function useSecurityRealtimeSync() {
  const queryClient = useQueryClient()
  useRealtimeEvent('DataPublished', () => {
    void queryClient.invalidateQueries({ queryKey: securityKeys.all })
  })
}
