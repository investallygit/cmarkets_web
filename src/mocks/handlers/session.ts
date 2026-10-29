import { http, HttpResponse } from 'msw'
import { ACCOUNT_TYPES, type LayoutItemDto, type ScreenLayoutDto } from '@/shared/api/contracts'
import { currentUser, readLayout, setAccountType, writeLayout } from '../db'
import { api, latency, noContent, problem } from '../lib/http'

export const sessionHandlers = [
  http.get(api('/me'), async () => {
    await latency()
    return HttpResponse.json(currentUser())
  }),

  // Prototype only: switch account type to preview each menu. Not part of CMarket.Api.
  http.put(api('/_prototype/session'), async ({ request }) => {
    const body = (await request.json()) as { accountType?: string }
    const accountType = ACCOUNT_TYPES.find((candidate) => candidate === body.accountType)
    if (!accountType) return problem(400, 'Unknown account type')
    setAccountType(accountType)
    return noContent()
  }),

  // Nothing saved yet: no positions, so the screen uses its default layout.
  // (The client also accepts a 404 for this case.)
  http.get(api('/me/layouts/:screen'), async ({ params }) => {
    await latency()
    const screen = String(params.screen)
    return HttpResponse.json<ScreenLayoutDto>({ screen, items: readLayout(screen) ?? [] })
  }),

  http.put(api('/me/layouts/:screen'), async ({ params, request }) => {
    const body = (await request.json()) as { items?: LayoutItemDto[] }
    if (!Array.isArray(body.items)) return problem(400, 'Invalid layout', 'items is required.')
    writeLayout(String(params.screen), body.items)
    return noContent()
  }),
]
