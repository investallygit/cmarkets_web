import type { ChatEventName, ChatHandler, RealtimeEventName, RealtimeHandler } from './events'

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

/**
 * Transport-agnostic access to the real-time hub: the SignalR implementation, or a fake one in
 * tests.
 */
export interface RealtimeClient {
  readonly state: ConnectionState
  /** Connects and keeps retrying in the background; never rejects. */
  start(): Promise<void>
  stop(): Promise<void>
  /** Hub methods Subscribe(string[]) / Unsubscribe(string[]) for securities shown on screen. */
  subscribe(symbols: string[]): Promise<void>
  unsubscribe(symbols: string[]): Promise<void>
  /** Returns a function that removes the handler. */
  on<E extends RealtimeEventName>(event: E, handler: RealtimeHandler<E>): () => void
  onStateChange(listener: (state: ConnectionState) => void): () => void
}

/**
 * The /hubs/chat hub of the messaging, a second connection beside the market's, opened for the
 * users who write to others.
 */
export interface ChatClient {
  readonly state: ConnectionState
  /** Connects and keeps retrying in the background; never rejects. */
  start(): Promise<void>
  stop(): Promise<void>
  /** Hub methods JoinConversation(id) / LeaveConversation(id) while a thread shows. */
  joinConversation(conversationId: string): Promise<void>
  leaveConversation(conversationId: string): Promise<void>
  /** Hub method Typing(conversationId): the others read "typing…". */
  typing(conversationId: string): Promise<void>
  /** Returns a function that removes the handler. */
  on<E extends ChatEventName>(event: E, handler: ChatHandler<E>): () => void
  onStateChange(listener: (state: ConnectionState) => void): () => void
}
