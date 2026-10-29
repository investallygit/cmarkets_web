import { delay, HttpResponse } from 'msw'
import type { Paged } from '@/shared/api/contracts'
import { env } from '@/shared/config/env'

/** Handler path of an API route: api('/me') -> '/api/v1/me'. */
export function api(path: string): string {
  return `${env.apiBaseUrl}${path}`
}

/** A little network latency, so loading states can be seen. */
export function latency(): Promise<void> {
  return delay(80 + Math.random() * 160)
}

/** RFC 7807 error body, the format CMarket.Api returns (spec section 10). */
export function problem(status: number, title: string, detail?: string) {
  return HttpResponse.json(
    { type: 'about:blank', title, status, detail },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

export function noContent() {
  return new HttpResponse(null, { status: 204 })
}

/** ?page=1&pageSize=50 -> { items, page, pageSize, totalCount } (spec section 10). */
export function paginate<T>(items: readonly T[], query: URLSearchParams): Paged<T> {
  const page = Math.max(1, Number(query.get('page') ?? 1))
  const pageSize = Math.min(200, Math.max(1, Number(query.get('pageSize') ?? 50)))
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    totalCount: items.length,
  }
}
