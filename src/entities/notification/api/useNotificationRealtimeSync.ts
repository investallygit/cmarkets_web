import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { notificationKeys } from './queries'

/** AlertTriggered refreshes the notification centre. Mounted once by the app shell. */
export function useNotificationRealtimeSync() {
  const queryClient = useQueryClient()
  useRealtimeEvent('AlertTriggered', () => {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  })
}
