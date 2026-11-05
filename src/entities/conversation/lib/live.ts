import type { InfiniteData } from '@tanstack/react-query'
import type { ConversationSummaryDto, MessageDto, MessagePageDto } from '@/shared/api/contracts'

/** The pages of a thread: the newest first, each one's messages the oldest first. */
export type MessagePages = InfiniteData<MessagePageDto, unknown>

/** MessageReceived: the message at the end of the thread read, unless it is there already. */
export function withMessage(
  data: MessagePages | undefined,
  message: MessageDto,
): MessagePages | undefined {
  if (!data || data.pages.length === 0) return data
  if (data.pages.some((page) => page.items.some((item) => item.id === message.id))) return data
  const [newest, ...older] = data.pages
  return { ...data, pages: [{ ...newest, items: [...newest.items, message] }, ...older] }
}

/** MessageDeleted: the message stays in its place, "This message was deleted.". */
export function withDeleted(
  data: MessagePages | undefined,
  messageId: string,
): MessagePages | undefined {
  if (!data) return data
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        item.id === messageId
          ? { ...item, text: '', deleted: true, attachments: [], shared: null, editable: false }
          : item,
      ),
    })),
  }
}

/**
 * The count on MSG in the menu: the unread messages and the requests waiting, out of the
 * conversations the user muted.
 */
export function unreadTotal(rows: readonly ConversationSummaryDto[]): number {
  return rows
    .filter((row) => !row.muted)
    .reduce((total, row) => total + row.unreadCount + (row.state === 'requestReceived' ? 1 : 0), 0)
}
