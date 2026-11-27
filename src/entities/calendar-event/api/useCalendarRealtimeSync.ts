import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { calendarKeys } from './queries'

/** The files whose publication moves CAL (screen 32): the auctions, the BEAC's, the issuers' events, the prices of dividends. */
const CALENDAR_FILES = new Set([
  'auctions',
  'auction-calendar',
  'beac-policy',
  'corporate-actions',
  'corporate-events',
  'bond-master',
  'correction',
])

/**
 * An event entered or corrected in CORR, a calendar file published or rolled back, an auction
 * result or a BEAC decision: every calendar query reads again. Mounted once by the app shell.
 */
export function useCalendarRealtimeSync() {
  const queryClient = useQueryClient()
  const refresh = () => void queryClient.invalidateQueries({ queryKey: calendarKeys.all })
  useRealtimeEvent('CalendarEventChanged', refresh)
  useRealtimeEvent('AuctionResultPublished', refresh)
  useRealtimeEvent('BeacDecisionPublished', refresh)
  useRealtimeEvent('DataPublished', ({ type }) => {
    if (CALENDAR_FILES.has(type)) refresh()
  })
}
