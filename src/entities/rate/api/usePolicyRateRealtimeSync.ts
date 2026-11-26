import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { ratesKeys } from './queries'

/**
 * A BEAC_POLICY file published or rolled back (screen 34, sixth version): its meetings' rates are
 * MKT's policy rates (ROADMAP decision 59), read again. Mounted once by the app shell.
 */
export function usePolicyRateRealtimeSync() {
  const queryClient = useQueryClient()
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ratesKeys.policy })
  useRealtimeEvent('DataPublished', ({ type }) => {
    if (type === 'beac-policy') refresh()
  })
  useRealtimeEvent('BeacDecisionPublished', refresh)
}
