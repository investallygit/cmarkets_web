import { http, HttpResponse } from 'msw'
import type { AuctionDto, CalendarEventDto } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { addDays } from '@/shared/lib/isoDate'
import { calendar } from '../db'
import { holidayEvents, redemptionEvents } from '../fixtures/calendar'
import { currentAuctions } from '../imports'
import { api, latency } from '../lib/http'

/** Calendar requests without dates cover the coming week. */
const DEFAULT_DAYS = 7

export const calendarHandlers = [
  http.get(api('/calendar'), async ({ request }) => {
    await latency()
    const query = new URL(request.url).searchParams
    const from = query.get('from') ?? toMarketDay(Date.now())
    const to = query.get('to') ?? addDays(from, DEFAULT_DAYS)
    const types = query.getAll('type')
    const country = query.get('country')
    // ISO dates compare as text.
    const events = [...calendar, ...holidayEvents(from, to), ...redemptionEvents(from, to)]
      .filter(
        (event) =>
          event.date >= from &&
          event.date <= to &&
          (types.length === 0 || types.includes(event.type)) &&
          (!country || event.country === null || event.country === country),
      )
      .sort((a, b) => a.date.localeCompare(b.date))
    return HttpResponse.json<CalendarEventDto[]>(events)
  }),

  http.get(api('/auctions'), async ({ request }) => {
    await latency()
    const query = new URL(request.url).searchParams
    const country = query.get('country')
    const instrument = query.get('instrument')
    const from = query.get('from')
    const to = query.get('to')
    const results = currentAuctions()
      .filter(
        (auction) =>
          (!country || auction.country === country) &&
          (!instrument || auction.instrument === instrument) &&
          (!from || auction.date >= from) &&
          (!to || auction.date <= to),
      )
      .sort((a, b) => b.date.localeCompare(a.date))
    return HttpResponse.json<AuctionDto[]>(results)
  }),
]
