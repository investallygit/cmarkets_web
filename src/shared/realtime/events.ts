import type {
  AccountType,
  IsoDate,
  IsoDateTime,
  MarketSessionStatus,
  MessageDto,
  NewsChannel,
  NewsType,
} from '@/shared/api/contracts'

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
  /** A news item came out; a FLASH also reaches its followers' alerts (spec section 10). */
  NewsPublished: {
    id: string
    title: string
    type: NewsType
    channel: NewsChannel
    sourceId: string
    securityIds: string[]
    ts: IsoDateTime
  }
  AlertTriggered: { alertId: string; message: string; ts: IsoDateTime }
  /** A data import was published: refresh the affected screens. */
  DataPublished: { importId: string; type: string; date: IsoDate }
  ImportStatusChanged: { importId: string; status: string; errors: number; warnings: number }
  PublicationPublished: { publicationId: string; subjectId: string; analystId: string }
}

export type RealtimeEventName = keyof RealtimeEventMap
export type RealtimeHandler<E extends RealtimeEventName> = (payload: RealtimeEventMap[E]) => void

/** Server → client messages of the /hubs/chat SignalR hub of the messaging (spec section 10). */
export interface ChatEventMap {
  MessageReceived: { conversationId: string; message: MessageDto }
  /** The message is read again: the payload does not carry it. */
  MessageUpdated: { conversationId: string; messageId: string }
  MessageDeleted: { conversationId: string; messageId: string }
  ReadReceipt: { conversationId: string; userId: string; lastReadMessageId: string }
  /** Sent again while the person types: the "typing…" ends a few seconds after the last one. */
  TypingIndicator: { conversationId: string; userId: string }
  /** Only for the people who show their online status (spec section 15). */
  PresenceChanged: { userId: string; online: boolean }
  ContactRequestReceived: { conversationId: string; fromUserId: string; fromType: AccountType }
  /**
   * Beyond spec section 10 (CMarket.Api): the conversation changed for the user, a request
   * accepted, a member added, taken out or gone, a mute; it is read again.
   */
  ConversationUpdated: { conversationId: string }
}

export type ChatEventName = keyof ChatEventMap
export type ChatHandler<E extends ChatEventName> = (payload: ChatEventMap[E]) => void
