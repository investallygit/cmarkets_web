import type { IsoDate, IsoDateTime, MarketSessionStatus } from '@/shared/api/contracts'

/** Server → client messages of the /hubs/market SignalR hub (spec section 10). */
export interface RealtimeEventMap {
  QuoteUpdated: {
    symbol: string
    last: number
    change: number
    changePct: number
    volume: number
    ts: IsoDateTime
  }
  IndexUpdated: { code: string; value: number; changePct: number; ts: IsoDateTime }
  MarketStatusChanged: { status: MarketSessionStatus; nextOpen: IsoDateTime | null }
  NewsPublished: { id: string; title: string; securityIds: string[]; ts: IsoDateTime }
  AlertTriggered: { alertId: string; message: string; ts: IsoDateTime }
  /** A data import was published: refresh the affected screens. */
  DataPublished: { importId: string; type: string; date: IsoDate }
  ImportStatusChanged: { importId: string; status: string; errors: number; warnings: number }
  PublicationPublished: { publicationId: string; subjectId: string; analystId: string }
}

export type RealtimeEventName = keyof RealtimeEventMap
export type RealtimeHandler<E extends RealtimeEventName> = (payload: RealtimeEventMap[E]) => void
