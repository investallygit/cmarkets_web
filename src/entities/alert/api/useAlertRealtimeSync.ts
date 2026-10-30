import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { alertKeys } from './queries'

/** AlertTriggered refreshes the alerts and the time each one last went off. Mounted once by the app shell. */
export function useAlertRealtimeSync() {
  const queryClient = useQueryClient()
  useRealtimeEvent('AlertTriggered', () => {
    void queryClient.invalidateQueries({ queryKey: alertKeys.all })
  })
}
