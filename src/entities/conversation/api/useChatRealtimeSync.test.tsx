import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MessageDto } from '@/shared/api/contracts'
import {
  RealtimeProvider,
  useJoinConversation,
  type ChatClient,
  type ChatEventMap,
  type ChatEventName,
  type ConnectionState,
  type RealtimeClient,
} from '@/shared/realtime'
import { useToastStore } from '@/shared/ui/toast'
import type { MessagePages } from '../lib/live'
import { resetChatState, useOnline, useTypingUsers } from '../model/chatState'
import { conversationKeys, messagesOf } from './queries'
import { useChatRealtimeSync } from './useChatRealtimeSync'

/** A hub whose events the test pushes. */
function fakeHub() {
  const handlers = new Map<ChatEventName, Set<(payload: never) => void>>()
  const listeners = new Set<(state: ConnectionState) => void>()
  const client = {
    state: 'connected',
    start: vi.fn(() => Promise.resolve()),
    stop: vi.fn(() => Promise.resolve()),
    joinConversation: vi.fn(() => Promise.resolve()),
    leaveConversation: vi.fn(() => Promise.resolve()),
    typing: vi.fn(() => Promise.resolve()),
    on: (event: ChatEventName, handler: (payload: never) => void) => {
      const set = handlers.get(event) ?? new Set()
      set.add(handler)
      handlers.set(event, set)
      return () => set.delete(handler)
    },
    onStateChange: (listener: (state: ConnectionState) => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  } as unknown as ChatClient
  return {
    client,
    push: <E extends ChatEventName>(event: E, payload: ChatEventMap[E]) =>
      act(() => handlers.get(event)?.forEach((handler) => handler(payload as never))),
    connected: () => act(() => listeners.forEach((listener) => listener('connected'))),
  }
}

const market = {
  state: 'connected',
  start: () => Promise.resolve(),
  stop: () => Promise.resolve(),
  subscribe: () => Promise.resolve(),
  unsubscribe: () => Promise.resolve(),
  on: () => () => undefined,
  onStateChange: () => () => undefined,
} as unknown as RealtimeClient

const message = (id: string, authorId: string) =>
  ({
    id,
    conversationId: 'c1',
    author: { userId: authorId, displayName: 'K. Atangana', accountType: 'analyst' },
    text: id,
    deleted: false,
    attachments: [],
    shared: null,
    editable: false,
  }) as unknown as MessageDto

function setup({ enabled = true, joined = false } = {}) {
  const hub = fakeHub()
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData<MessagePages>(conversationKeys.messages('c1'), {
    pages: [{ items: [message('m1', 'user-me')], hasMore: false }],
    pageParams: [null],
  })
  const refreshed = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider client={market} chat={hub.client}>
        {children}
      </RealtimeProvider>
    </QueryClientProvider>
  )
  const view = renderHook(
    () => {
      useChatRealtimeSync(enabled, 'user-me')
      useJoinConversation(joined ? 'c1' : null)
      return { typing: useTypingUsers('c1'), online: useOnline('user-k', false) }
    },
    { wrapper },
  )
  const thread = () =>
    messagesOf(queryClient.getQueryData<MessagePages>(conversationKeys.messages('c1'))).map(
      (item) => [item.id, item.deleted],
    )
  const refreshedKeys = () => refreshed.mock.calls.map(([filters]) => filters?.queryKey)
  return { hub, view, thread, refreshedKeys, refreshed }
}

// The /hubs/chat hub in the client (step 17): what each event changes.
describe('useChatRealtimeSync', () => {
  afterEach(() => {
    resetChatState()
    useToastStore.setState({ toasts: [] })
  })

  it('connects while the user may write, and closes with the session', () => {
    const { hub, view } = setup()
    expect(hub.client.start).toHaveBeenCalled()
    view.unmount()
    expect(hub.client.stop).toHaveBeenCalled()
    expect(setup({ enabled: false }).hub.client.start).not.toHaveBeenCalled()
  })

  it('adds a message of another to its thread and refreshes the rows', () => {
    const { hub, view, thread, refreshedKeys } = setup()
    // No thread of the conversation shows: its "typing…" is not kept.
    hub.push('TypingIndicator', { conversationId: 'c1', userId: 'user-k' })
    expect(view.result.current.typing).toEqual([])
    hub.push('MessageReceived', { conversationId: 'c1', message: message('m2', 'user-k') })
    expect(thread()).toEqual([
      ['m1', false],
      ['m2', false],
    ])
    expect(refreshedKeys()).toContainEqual(conversationKeys.lists())
  })

  it('shows "typing…" in the open thread until the message, which the thread reads', () => {
    const { hub, view, refreshedKeys } = setup({ joined: true })
    hub.push('TypingIndicator', { conversationId: 'c1', userId: 'user-k' })
    // The user's own Typing, from another tab, is not shown.
    hub.push('TypingIndicator', { conversationId: 'c1', userId: 'user-me' })
    expect(view.result.current.typing).toEqual(['user-k'])
    hub.push('MessageReceived', { conversationId: 'c1', message: message('m2', 'user-k') })
    expect(view.result.current.typing).toEqual([])
    // The rows are left to the open thread, which reads the message.
    expect(refreshedKeys()).not.toContainEqual(conversationKeys.lists())
  })

  it('reads a conversation again when it changed, and a message with its files', () => {
    const { hub, refreshedKeys } = setup()
    hub.push('ConversationUpdated', { conversationId: 'c1' })
    expect(refreshedKeys()).toEqual([
      conversationKeys.lists(),
      conversationKeys.detail('c1'),
      conversationKeys.messages('c1'),
    ])
    hub.push('MessageUpdated', { conversationId: 'c1', messageId: 'm1' })
    expect(refreshedKeys().slice(3)).toEqual([
      conversationKeys.messages('c1'),
      conversationKeys.lists(),
      conversationKeys.detail('c1'),
    ])
  })

  it('deletes in place, reads the ✓✓ again and follows the presence', () => {
    const { hub, view, thread, refreshedKeys } = setup()
    hub.push('MessageDeleted', { conversationId: 'c1', messageId: 'm1' })
    expect(thread()).toEqual([['m1', true]])
    hub.push('ReadReceipt', { conversationId: 'c1', userId: 'user-k', lastReadMessageId: 'm1' })
    expect(refreshedKeys()).toContainEqual(conversationKeys.messages('c1'))
    hub.push('PresenceChanged', { userId: 'user-k', online: true })
    expect(view.result.current.online).toBe(true)
  })

  it('tells a contact request, and reads everything again on a new connection', () => {
    const { hub, view, refreshedKeys } = setup()
    hub.push('ContactRequestReceived', {
      conversationId: 'c2',
      fromUserId: 'user-student',
      fromType: 'student',
    })
    expect(useToastStore.getState().toasts.map((toast) => toast.message)).toEqual([
      'New contact request (Student): see Requests in MSG.',
    ])
    hub.push('PresenceChanged', { userId: 'user-k', online: true })
    hub.connected()
    expect(view.result.current.online).toBe(false)
    expect(refreshedKeys()).toContainEqual(conversationKeys.all)
  })
})
