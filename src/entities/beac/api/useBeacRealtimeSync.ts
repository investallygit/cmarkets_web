import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { beacKeys } from './queries'

/** The files of BEAC (screen 6, sixth version): the meetings, the tenders, the weeks, the aggregates. */
const BEAC_FILES = new Set([
  'beac-policy',
  'beac-operations',
  'interbank-rates',
  'monetary-aggregates',
])

/**
 * A BEAC file published or rolled back, or a decision published (screen 34): every BEAC query
 * reads again. Mounted once by the app shell.
 */
export function useBeacRealtimeSync() {
  const queryClient = useQueryClient()
  const refresh = () => void queryClient.invalidateQueries({ queryKey: beacKeys.all })
  useRealtimeEvent('DataPublished', ({ type }) => {
    if (BEAC_FILES.has(type)) refresh()
  })
  useRealtimeEvent('BeacDecisionPublished', refresh)
}
