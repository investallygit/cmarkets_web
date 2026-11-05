import { describe, expect, it } from 'vitest'
import {
  conversationState,
  dailyConversations,
  inFilter,
  isEditable,
  matchExcerpt,
  openedToday,
  pageOf,
  readByAll,
  readMessage,
  unreadCount,
  type StoredConversation,
  type StoredMessage,
} from './messaging'

// The rules of the messaging, spec section 15.
const member = (userId: string, lastReadAt: string | null = null) => ({
  userId,
  joinedAt: '2026-11-01T08:00:00Z',
  leftAt: null,
  lastReadAt,
  muted: false,
})

const conversation = (patch: Partial<StoredConversation> = {}): StoredConversation => ({
  id: 'conversation-1',
  kind: 'direct',
  title: null,
  createdBy: 'user-a',
  createdAt: '2026-11-01T08:00:00Z',
  members: [member('user-a', '2026-11-01T08:00:00Z'), member('user-b')],
  request: null,
  updatedAt: '2026-11-01T08:00:00Z',
  ...patch,
})

const message = (id: string, authorId: string, sentAt: string): StoredMessage => ({
  id,
  conversationId: 'conversation-1',
  authorId,
  text: `Message ${id}`,
  sentAt,
  editedAt: null,
  deletedAt: null,
  attachmentIds: [],
  shared: null,
})

describe('messaging rules', () => {
  it('show a request waiting to its recipient alone; a block or leaving closes it', () => {
    const request = conversation({ request: { to: 'user-b', status: 'pending' } })
    expect(conversationState(request, 'user-b', false)).toBe('requestReceived')
    expect(conversationState(request, 'user-a', false)).toBe('requestSent')
    // A decline is not told to the sender.
    const declined = conversation({ request: { to: 'user-b', status: 'declined' } })
    expect(conversationState(declined, 'user-a', false)).toBe('requestSent')
    expect(conversationState(conversation(), 'user-a', true)).toBe('closed')
    const left = conversation({ members: [{ ...member('user-a'), leftAt: '2026-11-02' }] })
    expect(conversationState(left, 'user-a', false)).toBe('closed')
    expect(conversationState(conversation(), 'user-c', false)).toBe('closed')
  })

  it('count the unread messages of the others, and read receipts for every member', () => {
    const messages = [
      message('1', 'user-b', '2026-11-01T09:00:00Z'),
      message('2', 'user-a', '2026-11-01T09:05:00Z'),
      { ...message('3', 'user-b', '2026-11-01T09:10:00Z'), deletedAt: '2026-11-01T09:11:00Z' },
      message('4', 'user-b', '2026-11-01T09:20:00Z'),
    ]
    expect(unreadCount(messages, member('user-a', '2026-11-01T08:00:00Z'))).toBe(2)
    expect(unreadCount(messages, member('user-a', '2026-11-01T09:20:00Z'))).toBe(0)
    const read = conversation({
      members: [member('user-a'), member('user-b', '2026-11-01T09:05:00Z')],
    })
    expect(readByAll(messages[1], read)).toBe(true)
    expect(readByAll(messages[1], conversation())).toBe(false)
  })

  it('edit only one’s own message, within 15 minutes', () => {
    const sent = message('1', 'user-a', '2026-11-01T09:00:00Z')
    const at = (minutes: number) => Date.parse('2026-11-01T09:00:00Z') + minutes * 60_000
    expect(isEditable(sent, 'user-a', at(15))).toBe(true)
    expect(isEditable(sent, 'user-a', at(16))).toBe(false)
    expect(isEditable(sent, 'user-b', at(1))).toBe(false)
  })

  it('give the history 50 at a time, the newest page first', () => {
    const messages = Array.from({ length: 120 }, (_, index) =>
      message(String(index), 'user-a', new Date(Date.UTC(2026, 10, 1, 8, index)).toISOString()),
    )
    const last = pageOf(messages, null)
    expect(last.items.map((item) => item.id).slice(0, 2)).toEqual(['70', '71'])
    expect(last.hasMore).toBe(true)
    const before = pageOf(messages, '20')
    expect(before.items).toHaveLength(20)
    expect(before.hasMore).toBe(false)
  })

  it('sort the rows into the tabs and find the words of a search', () => {
    const row = { kind: 'direct', unreadCount: 0, state: 'requestReceived' } as const
    expect(inFilter('requests', row)).toBe(true)
    expect(inFilter('unread', row)).toBe(false)
    expect(inFilter('groups', { ...row, kind: 'group' })).toBe(true)
    expect(matchExcerpt("Gabon's budget assumes $70 a barrel", 'BUDGET gabon')).toBe(
      "Gabon's budget assumes $70 a barrel",
    )
    expect(matchExcerpt('Le marché régional', 'marche')).toBe('Le marché régional')
    expect(matchExcerpt('Nothing here', 'curve')).toBeNull()
  })

  it('check a message and the new conversations of the day', () => {
    expect(readMessage({ text: '  ' }).errors.text).toEqual(['Write a message.'])
    expect(readMessage({ text: 'x'.repeat(4001) }).errors.text).toEqual([
      '4000 characters at most.',
    ])
    expect(
      readMessage({ text: '', shared: { type: 'chart', securityId: 'SEMC', period: '1Y' } }),
    ).toMatchObject({ errors: {}, message: { shared: { type: 'chart', period: '1Y' } } })
    expect(readMessage({ shared: { type: 'chart', securityId: 'SEMC' } }).errors.shared).toEqual([
      'A security, a chart or a publication.',
    ])
    expect(dailyConversations('student')).toBe(5)
    expect(dailyConversations('manager')).toBe(20)
    const opened = [conversation(), conversation({ createdAt: '2026-10-31T08:00:00Z' })]
    expect(openedToday(opened, 'user-a', '2026-11-01', (iso) => iso.slice(0, 10))).toBe(1)
  })
})
