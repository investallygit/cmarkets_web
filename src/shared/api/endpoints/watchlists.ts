import type { WatchlistDto, WatchlistInputDto, WatchlistItemDto } from '../contracts'
import { answer, route, send } from './define'

/** CMarket.Api/Controllers/Watchlists: the user's lists, one tab each on MKT. */
export const watchlistsRoutes = {
  list: route('GET', '/watchlists', answer<WatchlistDto[]>()),
  create: route('POST', '/watchlists', answer<WatchlistDto>()),
  update: route('PUT', '/watchlists/{id}', answer<WatchlistDto>()),
  remove: route('DELETE', '/watchlists/{id}'),
  addItem: route('POST', '/watchlists/{id}/items/{securityId}', answer<WatchlistItemDto>()),
  removeItem: route('DELETE', '/watchlists/{id}/items/{securityId}'),
}

export const watchlistsApi = {
  /** The user's lists with the quote of each security. */
  list: (signal?: AbortSignal) => send(watchlistsRoutes.list, { signal }),
  create: (input: WatchlistInputDto) => send(watchlistsRoutes.create, { body: input }),
  /** Renames a list or changes its columns. */
  update: (id: string, input: WatchlistInputDto) =>
    send(watchlistsRoutes.update, { params: { id }, body: input }),
  remove: (id: string) => send(watchlistsRoutes.remove, { params: { id } }),
  /** Answers the item's row; one already in the list comes back unchanged. */
  addItem: (id: string, securityId: string) =>
    send(watchlistsRoutes.addItem, { params: { id, securityId } }),
  removeItem: (id: string, securityId: string) =>
    send(watchlistsRoutes.removeItem, { params: { id, securityId } }),
}
