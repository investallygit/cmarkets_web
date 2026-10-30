import { http, HttpResponse } from 'msw'
import type {
  WatchlistColumn,
  WatchlistDto,
  WatchlistInputDto,
  WatchlistItemDto,
} from '@/shared/api/contracts'
import {
  changePct,
  currentAccountType,
  securities,
  watchlistStore,
  type MockSecurity,
  type StoredWatchlist,
} from '../db'
import { api, latency, noContent, problem } from '../lib/http'

const COLUMNS: readonly WatchlistColumn[] = [
  'name',
  'last',
  'change',
  'changePct',
  'volume',
  'sparkline',
]
const MAX_NAME_LENGTH = 40

function toItem(security: MockSecurity): WatchlistItemDto {
  return {
    securityId: security.id,
    code: security.code,
    name: security.name,
    type: security.type,
    currency: security.currency,
    last: security.last,
    change: security.last - security.previousClose,
    changePct: changePct(security.last, security.previousClose),
    volume: security.volume,
    // Students see delayed prices (spec section 12).
    isDelayed: currentAccountType() === 'student',
    sparkline: [...security.sparkline],
  }
}

function toDto({ securityIds, ...list }: StoredWatchlist): WatchlistDto {
  return {
    ...list,
    items: securityIds.flatMap((id) => {
      const security = securities.get(id)
      return security ? [toItem(security)] : []
    }),
  }
}

/** The fields of a list, or a 400 ProblemDetails with the errors by field, as FluentValidation. */
function readInput(body: Partial<WatchlistInputDto>) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (name === '' || name.length > MAX_NAME_LENGTH) {
    return {
      error: problem(400, 'Invalid watchlist', undefined, {
        name: [`Between 1 and ${MAX_NAME_LENGTH} characters.`],
      }),
    }
  }
  const columns = COLUMNS.filter((column) => body.columns?.includes(column))
  return { name, columns }
}

/** W1, W2...: the first code no list of the user has. */
function nextCode(lists: readonly StoredWatchlist[]): string {
  let number = 1
  while (lists.some((list) => list.code === `W${number}`)) number += 1
  return `W${number}`
}

function findList(id: unknown) {
  const lists = watchlistStore.read()
  return { lists, list: lists.find((candidate) => candidate.id === id) }
}

const notFound = (id: unknown) => problem(404, 'Watchlist not found', `No watchlist ${String(id)}.`)

export const watchlistHandlers = [
  http.get(api('/watchlists'), async () => {
    await latency()
    return HttpResponse.json(watchlistStore.read().map(toDto))
  }),

  http.post(api('/watchlists'), async ({ request }) => {
    await latency()
    const body = (await request.json()) as Partial<WatchlistInputDto>
    const input = readInput(body)
    if ('error' in input) return input.error
    const lists = watchlistStore.read()
    const list: StoredWatchlist = {
      id: `watchlist-${Date.now().toString(36)}`,
      code: nextCode(lists),
      ...input,
      securityIds: [...new Set(body.securityIds ?? [])].filter((id) => securities.has(id)),
    }
    watchlistStore.write([...lists, list])
    return HttpResponse.json(toDto(list), { status: 201 })
  }),

  http.put(api('/watchlists/:id'), async ({ params, request }) => {
    await latency()
    const input = readInput((await request.json()) as Partial<WatchlistInputDto>)
    if ('error' in input) return input.error
    const { lists, list } = findList(params.id)
    if (!list) return notFound(params.id)
    const updated = { ...list, ...input }
    watchlistStore.write(lists.map((candidate) => (candidate === list ? updated : candidate)))
    return HttpResponse.json(toDto(updated))
  }),

  http.delete(api('/watchlists/:id'), async ({ params }) => {
    await latency()
    const { lists, list } = findList(params.id)
    if (!list) return notFound(params.id)
    watchlistStore.write(lists.filter((candidate) => candidate !== list))
    return noContent()
  }),

  // Adding a security already in the list changes nothing and returns it again.
  http.post(api('/watchlists/:id/items/:securityId'), async ({ params }) => {
    await latency()
    const { lists, list } = findList(params.id)
    if (!list) return notFound(params.id)
    const security = securities.get(String(params.securityId))
    if (!security) {
      return problem(404, 'Unknown security', `No security ${String(params.securityId)}.`)
    }
    if (!list.securityIds.includes(security.id)) {
      const updated = { ...list, securityIds: [...list.securityIds, security.id] }
      watchlistStore.write(lists.map((candidate) => (candidate === list ? updated : candidate)))
    }
    return HttpResponse.json(toItem(security), { status: 201 })
  }),

  http.delete(api('/watchlists/:id/items/:securityId'), async ({ params }) => {
    await latency()
    const { lists, list } = findList(params.id)
    if (!list) return notFound(params.id)
    const updated = {
      ...list,
      securityIds: list.securityIds.filter((id) => id !== params.securityId),
    }
    watchlistStore.write(lists.map((candidate) => (candidate === list ? updated : candidate)))
    return noContent()
  }),
]
