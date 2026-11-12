import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { etfKeys } from './queries'

/** What moves the ETFs' figures (spec section 11): their profiles, their NAV and spreads, a price corrected. */
const ETF_INPUTS = new Set(['etf-profiles', 'etf-nav', 'correction'])

/** A publication of IMP refreshes ETFS and the ETFs' reads. Mounted once by the app shell. */
export function useEtfRealtimeSync() {
  const queryClient = useQueryClient()
  useRealtimeEvent('DataPublished', ({ type }) => {
    if (ETF_INPUTS.has(type)) void queryClient.invalidateQueries({ queryKey: etfKeys.all })
  })
}
