import { useCallback, useRef } from 'react'
import { useChatClient } from '@/shared/realtime'
import { TYPING_NOTIFY_MS } from '../config/messaging'
import { unreadTotal } from '../lib/live'
import { useConversations } from './queries'

/** Typing(conversationId) while the user writes, every 2.5 seconds at most. */
export function useTypingNotifier(conversationId: string | null): () => void {
  const chat = useChatClient()
  const sentAt = useRef(0)
  return useCallback(() => {
    if (!conversationId) return
    const now = Date.now()
    if (now - sentAt.current < TYPING_NOTIFY_MS) return
    sentAt.current = now
    // "typing…" is a courtesy: a failure is not worth telling the user.
    chat.typing(conversationId).catch(() => undefined)
  }, [chat, conversationId])
}

/** The count on MSG in the menu, for a user who may write; 0 for the others. */
export function useUnreadTotal(enabled: boolean): number {
  const rows = useConversations('all', { enabled })
  return enabled && rows.data ? unreadTotal(rows.data) : 0
}
