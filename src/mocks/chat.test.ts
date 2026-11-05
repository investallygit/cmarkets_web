import { getResponse } from 'msw'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ConversationDto, ConversationSummaryDto } from '@/shared/api/contracts'
import type { ChatClient, ChatEventMap, ChatEventName } from '@/shared/realtime'

type Db = typeof import('./db')
type Chat = typeof import('./chat')
type Handlers = typeof import('./handlers/messaging').messagingHandlers

const EVENTS: ChatEventName[] = [
  'MessageReceived',
  'MessageUpdated',
  'MessageDeleted',
  'ReadReceipt',
  'TypingIndicator',
  'PresenceChanged',
  'ContactRequestReceived',
]

type Pushed = { [E in ChatEventName]: [E, ChatEventMap[E]] }[ChatEventName]

// The simulated /hubs/chat hub (step 17): presence, read receipts, "typing…" and the answers of
// the people of the screen 11 mockup.
describe('chat hub', () => {
  let db: Db
  let chat: Chat
  let handlers: Handlers
  const hubs: ChatClient[] = []

  beforeAll(async () => {
    db = await import('./db')
    chat = await import('./chat')
    const messaging = await import('./handlers/messaging')
    const directory = await import('./handlers/directory')
    handlers = [...messaging.messagingHandlers, ...directory.directoryHandlers]
  })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(async () => {
    await Promise.all(hubs.splice(0).map((hub) => hub.stop()))
    vi.useRealTimers()
  })

  /** A route of the mock, its latency run on the fake clock. */
  async function call(userId: string, method: string, path: string, body?: unknown) {
    db.setSessionUser(userId)
    const request = new Request(new URL(`/api/v1${path}`, window.location.origin), {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    const pending = getResponse(handlers, request)
    await vi.advanceTimersByTimeAsync(300)
    const response = await pending
    if (!response) throw new Error(`No route for ${method} ${path}`)
    return response
  }

  /** The hub of a user, connected, and the events it pushed, in order. */
  async function connect(userId: string) {
    db.setSessionUser(userId)
    const hub = chat.createMockChatClient()
    hubs.push(hub)
    const pushed: Pushed[] = []
    for (const event of EVENTS) {
      hub.on(event, (payload) => pushed.push([event, payload] as Pushed))
    }
    const started = hub.start()
    await vi.advanceTimersByTimeAsync(300)
    await started
    expect(hub.state).toBe('connected')
    return { hub, pushed, names: () => pushed.map(([event]) => event) }
  }

  const send = async (userId: string, conversationId: string, text: string) => {
    const response = await call(userId, 'POST', `/conversations/${conversationId}/messages`, {
      text,
    })
    expect(response.status).toBe(201)
  }

  it('says who is online in the conversations, as the green dots of screen 11', async () => {
    const rows = (await (
      await call('user-manager', 'GET', '/conversations')
    ).json()) as ConversationSummaryDto[]
    const online = Object.fromEntries(rows.map((row) => [row.title, row.counterpart?.online]))
    expect(online).toEqual({
      'K. Atangana': true,
      'CEMAC rates desk': undefined,
      'M. Ndong': true,
      'S. Mvondo': false,
      'R. Tamba': false,
      'E. Fouda': false,
    })
  })

  it('K. Atangana types then answers when P. Owona opens the thread, once', async () => {
    const { hub, pushed, names } = await connect('user-manager')
    await hub.joinConversation('conversation-atangana')
    await vi.advanceTimersByTimeAsync(10_000)
    expect(names()).toEqual([
      'TypingIndicator',
      'TypingIndicator',
      'TypingIndicator',
      'MessageReceived',
    ])
    expect(pushed[0][1]).toEqual({
      conversationId: 'conversation-atangana',
      userId: 'user-analyst',
    })
    const [, received] = pushed[3]
    expect(received).toMatchObject({
      conversationId: 'conversation-atangana',
      message: {
        author: { userId: 'user-analyst', displayName: 'K. Atangana' },
        text: expect.stringContaining("Wednesday's 5-year OTA auction"),
        readByAll: null,
      },
    })
    const rows = (await (
      await call('user-manager', 'GET', '/conversations')
    ).json()) as ConversationSummaryDto[]
    expect(rows[0]).toMatchObject({
      title: 'K. Atangana',
      unreadCount: 1,
      lastMessage: { authorId: 'user-analyst' },
    })

    // Once: opening the thread again brings nothing new.
    await hub.leaveConversation('conversation-atangana')
    await hub.joinConversation('conversation-atangana')
    await vi.advanceTimersByTimeAsync(10_000)
    expect(pushed).toHaveLength(4)
  })

  // Once: before the Analyst's hub runs past half a minute in the tests below.
  it('a contact request from S. Mvondo reaches the Analyst half a minute after login', async () => {
    const { pushed } = await connect('user-analyst')
    await vi.advanceTimersByTimeAsync(chat.REQUEST_AFTER_MS - 1_000)
    expect(pushed).toEqual([])
    await vi.advanceTimersByTimeAsync(1_000)
    expect(pushed).toEqual([
      [
        'ContactRequestReceived',
        {
          conversationId: 'conversation-mvondo-atangana',
          fromUserId: 'user-student',
          fromType: 'student',
        },
      ],
    ])
    const requests = (await (
      await call('user-analyst', 'GET', '/conversations?filter=requests')
    ).json()) as ConversationSummaryDto[]
    expect(requests.map((row) => row.title)).toEqual(['S. Mvondo', 'B. Eyinga'])

    // Once.
    const again = await connect('user-analyst')
    await vi.advanceTimersByTimeAsync(chat.REQUEST_AFTER_MS + 1_000)
    expect(again.pushed).toEqual([])
  })

  it('R. Tamba comes online to read, type and answer the Analyst, then leaves', async () => {
    const { hub, pushed, names } = await connect('user-analyst')
    await hub.joinConversation('conversation-tamba-atangana')
    await send('user-analyst', 'conversation-tamba-atangana', 'Yes, call me in the morning.')
    await vi.advanceTimersByTimeAsync(10_000)
    expect(names()).toEqual([
      'PresenceChanged',
      'ReadReceipt',
      'TypingIndicator',
      'TypingIndicator',
      'TypingIndicator',
      'MessageReceived',
    ])
    expect(pushed[0][1]).toEqual({ userId: 'user-journalist', online: true })
    expect(pushed[1][1]).toMatchObject({
      conversationId: 'conversation-tamba-atangana',
      userId: 'user-journalist',
    })
    // ✓✓ on the Analyst's message.
    const details = (await (
      await call('user-analyst', 'GET', '/conversations/conversation-tamba-atangana')
    ).json()) as ConversationDto
    expect(details.counterpart?.online).toBe(true)

    await vi.advanceTimersByTimeAsync(60_000)
    expect(pushed.filter(([event]) => event === 'PresenceChanged').at(-1)).toEqual([
      'PresenceChanged',
      { userId: 'user-journalist', online: false },
    ])
  })

  it('only reads, or does nothing, without an answer scripted', async () => {
    // P. Owona is offline for the Analyst: nothing.
    const analyst = await connect('user-analyst')
    await send('user-analyst', 'conversation-atangana', 'The curve goes out tonight.')
    await vi.advanceTimersByTimeAsync(10_000)
    expect(analyst.pushed).toEqual([])
    await analyst.hub.stop()

    // K. Atangana, online, answered already: P. Owona's message is read, not answered.
    const manager = await connect('user-manager')
    await send('user-manager', 'conversation-atangana', 'Thanks, I will read it tomorrow.')
    await vi.advanceTimersByTimeAsync(10_000)
    expect(manager.names()).toEqual(['ReadReceipt'])
  })

  it('a block stops an answer under way', async () => {
    const { hub, pushed } = await connect('user-manager')
    await hub.joinConversation('conversation-ndong')
    await send('user-manager', 'conversation-ndong', 'Does the budget include the new oil fields?')
    const blocked = await call('user-manager', 'POST', '/blocks/user-ndong')
    expect(blocked.ok).toBe(true)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(pushed).toEqual([])
    expect((await call('user-manager', 'DELETE', '/blocks/user-ndong')).ok).toBe(true)
  })

  it('stops its scenes with the session', async () => {
    const { hub, pushed } = await connect('user-manager')
    await hub.joinConversation('conversation-ndong')
    await send('user-manager', 'conversation-ndong', 'One more question on Gabon.')
    await hub.stop()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(pushed).toEqual([])
    expect(hub.state).toBe('disconnected')
  })
})
