import { http, HttpResponse } from 'msw'
import type {
  CalendarEventDto,
  FxRateDto,
  NewsArticleDto,
  NewsItemDto,
  Paged,
  PolicyRateDto,
  WatchlistDto,
} from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { calendar, changePct, currentAccountType, news, notifications, securities } from '../db'
import { articleBody } from '../fixtures/feeds'
import { FX_FIXTURES, POLICY_RATE_FIXTURES } from '../fixtures/market'
import { WATCHLIST_FIXTURES } from '../fixtures/users'
import { api, latency, noContent, paginate, problem } from '../lib/http'

export const listHandlers = [
  http.get(api('/watchlists'), async () => {
    await latency()
    const isDelayed = currentAccountType() === 'student'
    const lists: WatchlistDto[] = WATCHLIST_FIXTURES.map(({ securityIds, ...list }) => ({
      ...list,
      items: securityIds.flatMap((id) => {
        const security = securities.get(id)
        if (!security) return []
        return [
          {
            securityId: security.id,
            code: security.code,
            name: security.name,
            type: security.type,
            currency: security.currency,
            last: security.last,
            changePct: changePct(security.last, security.previousClose),
            volume: security.volume,
            isDelayed,
            sparkline: [...security.sparkline],
          },
        ]
      }),
    }))
    return HttpResponse.json(lists)
  }),

  http.get(api('/rates/policy'), async () => {
    await latency()
    const asOf = toMarketDay(Date.now())
    return HttpResponse.json<PolicyRateDto[]>(
      POLICY_RATE_FIXTURES.map((rate) => ({ ...rate, asOf })),
    )
  }),

  http.get(api('/fx'), async ({ request }) => {
    await latency()
    const pairs = new URL(request.url).searchParams.get('pairs')?.split(',') ?? []
    const timestamp = new Date().toISOString()
    const rates: FxRateDto[] = FX_FIXTURES.filter(
      (fx) => pairs.length === 0 || pairs.includes(fx.pair),
    ).map(({ previousClose, ...fx }) => ({
      ...fx,
      changePct: changePct(fx.value, previousClose),
      timestamp,
    }))
    return HttpResponse.json(rates)
  }),

  http.get(api('/news'), async ({ request }) => {
    await latency()
    const query = new URL(request.url).searchParams
    const topic = query.get('topic')
    const securityId = query.get('securityId')
    const country = query.get('country')
    const items = news.filter(
      (item) =>
        (!topic || item.topic === topic) &&
        (!securityId || item.securityIds.includes(securityId)) &&
        (!country || item.country === country),
    )
    return HttpResponse.json<Paged<NewsItemDto>>(paginate(items, query))
  }),

  http.get(api('/news/:id'), async ({ params }) => {
    await latency()
    const item = news.find((candidate) => candidate.id === params.id)
    if (!item) return problem(404, 'News not found', `No news ${String(params.id)}.`)
    return HttpResponse.json<NewsArticleDto>({ ...item, body: articleBody(item) })
  }),

  http.get(api('/calendar'), async ({ request }) => {
    await latency()
    const query = new URL(request.url).searchParams
    const from = query.get('from')
    const to = query.get('to')
    const type = query.get('type')
    // ISO dates compare as text.
    const events = calendar.filter(
      (event) =>
        (!from || event.date >= from) &&
        (!to || event.date <= to) &&
        (!type || event.type === type),
    )
    return HttpResponse.json<CalendarEventDto[]>(events)
  }),

  http.get(api('/notifications'), async ({ request }) => {
    await latency()
    return HttpResponse.json(paginate(notifications, new URL(request.url).searchParams))
  }),

  http.post(api('/notifications/:id/read'), ({ params }) => {
    const notification = notifications.find((candidate) => candidate.id === params.id)
    if (!notification) return problem(404, 'Notification not found')
    notification.read = true
    return noContent()
  }),
]
