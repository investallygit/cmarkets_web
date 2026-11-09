import type { ConversationSummaryDto } from '@/shared/api/contracts'

/**
 * The conversations a news item can be sent to: open ones only (a request waits for its answer, a
 * block or a group left closes one), whose name holds what was typed, accents and case aside.
 */
export function openConversations(
  conversations: readonly ConversationSummaryDto[],
  q: string,
): ConversationSummaryDto[] {
  const text = fold(q.trim())
  return conversations.filter(
    (conversation) =>
      conversation.state === 'open' && (!text || fold(conversation.title).includes(text)),
  )
}

const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
