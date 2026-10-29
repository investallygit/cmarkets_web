import type { RealtimeEventName, RealtimeHandler } from './events'

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

/**
 * Transport-agnostic access to the real-time hub. The app uses the SignalR implementation;
 * the prototype uses a simulated one from src/mocks.
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
