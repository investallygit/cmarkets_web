import { create } from 'zustand'
import { TYPING_SHOWN_MS } from '../config/messaging'

interface ChatState {
  /** By conversation, the people typing in it. */
  typing: Record<string, string[]>
  /** By user, the presence the hub pushed since the conversations were read. */
  online: Record<string, boolean>
}

export const useChatState = create<ChatState>()(() => ({ typing: {}, online: {} }))

const typingTimers = new Map<string, number>()
const timerKey = (conversationId: string, userId: string) => `${conversationId}|${userId}`

/** TypingIndicator: the person types until their message, or a few seconds without another one. */
export function startTyping(conversationId: string, userId: string): void {
  const key = timerKey(conversationId, userId)
  window.clearTimeout(typingTimers.get(key))
  typingTimers.set(
    key,
    window.setTimeout(() => stopTyping(conversationId, userId), TYPING_SHOWN_MS),
  )
  useChatState.setState((state) => {
    const current = state.typing[conversationId] ?? []
    if (current.includes(userId)) return state
    return { typing: { ...state.typing, [conversationId]: [...current, userId] } }
  })
}

export function stopTyping(conversationId: string, userId: string): void {
  const key = timerKey(conversationId, userId)
  window.clearTimeout(typingTimers.get(key))
  typingTimers.delete(key)
  useChatState.setState((state) => {
    const current = state.typing[conversationId]
    if (!current?.includes(userId)) return state
    const typing = { ...state.typing }
    const rest = current.filter((id) => id !== userId)
    if (rest.length > 0) typing[conversationId] = rest
    else delete typing[conversationId]
    return { typing }
  })
}

/** PresenceChanged */
export function setPresence(userId: string, online: boolean): void {
  useChatState.setState((state) =>
    state.online[userId] === online ? state : { online: { ...state.online, [userId]: online } },
  )
}

/** A new connection, or the session ended: what the hub pushed before is read again. */
export function resetChatState(): void {
  typingTimers.forEach((timer) => window.clearTimeout(timer))
  typingTimers.clear()
  useChatState.setState({ typing: {}, online: {} })
}

const NOBODY: string[] = []

/** The people typing in the conversation, in the order they started. */
export function useTypingUsers(conversationId: string): string[] {
  return useChatState((state) => state.typing[conversationId] ?? NOBODY)
}

/**
 * Whether the person is online: what the hub pushed last, otherwise what the conversation said
 * when read (null: the person does not show it).
 */
export function useOnline(userId: string | undefined, read: boolean | null | undefined): boolean {
  const pushed = useChatState((state) => (userId ? state.online[userId] : undefined))
  return pushed ?? read ?? false
}
