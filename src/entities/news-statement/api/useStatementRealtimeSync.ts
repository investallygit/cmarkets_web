import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { providerStatementKeys } from './queries'

/**
 * A newspaper is told each step of its statement by a notice (AlertTriggered, the only event that
 * names it): its studio's statements are read again with it, so that the list says what the notice
 * does (B97). Only a studio showing them asks. Mounted once by the app shell.
 */
export function useStatementRealtimeSync() {
  const queryClient = useQueryClient()
  useRealtimeEvent('AlertTriggered', () => {
    void queryClient.invalidateQueries({ queryKey: providerStatementKeys.all })
  })
}
