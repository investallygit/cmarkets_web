import { ONLINE_AT_START } from '../fixtures/messaging'

/**
 * The real time of the messaging (the /hubs/chat hub, step 17 of the roadmap): who is online, and
 * the user's messages, which the simulated people read and answer. Kept by this tab only: every
 * load starts from the people of the mockup.
 */

const online = new Set<string>(ONLINE_AT_START)

/** Connected now, whether or not the person shows it. */
export const isOnline = (userId: string) => online.has(userId)

/** Returns whether the presence changed. */
export function setOnline(userId: string, value: boolean): boolean {
  if (online.has(userId) === value) return false
  if (value) online.add(userId)
  else online.delete(userId)
  return true
}

/** The user wrote in a conversation: a message stored, its conversation saved. */
export interface UserMessageEvent {
  conversationId: string
  messageId: string
}

const messageListeners = new Set<(event: UserMessageEvent) => void>()

/** The user's messages, for the simulated hub to answer. */
export function onUserMessage(listener: (event: UserMessageEvent) => void): () => void {
  messageListeners.add(listener)
  return () => messageListeners.delete(listener)
}

export function announceUserMessage(event: UserMessageEvent): void {
  messageListeners.forEach((listener) => listener(event))
}
