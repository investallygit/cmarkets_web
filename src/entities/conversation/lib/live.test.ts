import { describe, expect, it } from 'vitest'
import type { ConversationSummaryDto, MessageDto } from '@/shared/api/contracts'
import { unreadTotal, withDeleted, withMessage, type MessagePages } from './live'

// What the /hubs/chat hub changes in the data already read (step 17).
const message = (id: string, text = id) =>
  ({
    id,
    text,
    deleted: false,
    attachments: [],
    shared: null,
    editable: true,
  }) as unknown as MessageDto

const pages = (...items: string[][]): MessagePages => ({
  pages: items.map((ids, index) => ({
    items: ids.map((id) => message(id)),
    hasMore: index < items.length - 1,
  })),
  pageParams: items.map((_, index) => (index === 0 ? null : `m${index}`)),
})

const ids = (data: MessagePages | undefined) =>
  data?.pages.map((page) => page.items.map((item) => item.id))

describe('live thread', () => {
  it('adds a new message at the end of the newest page, once', () => {
    const data = pages(['m3', 'm4'], ['m1', 'm2'])
    const next = withMessage(data, message('m5'))
    expect(ids(next)).toEqual([
      ['m3', 'm4', 'm5'],
      ['m1', 'm2'],
    ])
    // The user's own message, back from the hub after the request that sent it.
    expect(withMessage(next, message('m5'))).toBe(next)
    // A thread never read stays to be read.
    expect(withMessage(undefined, message('m5'))).toBeUndefined()
  })

  it('leaves a deleted message in its place, without its text, files or object', () => {
    const next = withDeleted(pages(['m1', 'm2']), 'm1')
    expect(next?.pages[0].items[0]).toMatchObject({
      id: 'm1',
      text: '',
      deleted: true,
      attachments: [],
      shared: null,
      editable: false,
    })
    expect(next?.pages[0].items[1]).toMatchObject({ id: 'm2', deleted: false })
  })
})

describe('the count on MSG', () => {
  const row = (unreadCount: number, extra: Partial<ConversationSummaryDto> = {}) =>
    ({ unreadCount, muted: false, state: 'open', ...extra }) as ConversationSummaryDto

  it('adds the unread messages and the requests waiting, out of the muted conversations', () => {
    // P. Owona on screen 11: the rates desk (2), M. Ndong (1), S. Mvondo's request.
    expect(unreadTotal([row(0), row(2), row(1), row(0, { state: 'requestReceived' })])).toBe(4)
    expect(unreadTotal([row(2, { muted: true }), row(1)])).toBe(1)
    expect(unreadTotal([row(0, { state: 'requestSent' })])).toBe(0)
  })
})
