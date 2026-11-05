import type { MessageDto } from '@/shared/api/contracts'
import type { ChatClient, ChatEventMap, ChatEventName, ConnectionState } from '@/shared/realtime'
import {
  anyAccount,
  contactModeFor,
  conversationStore,
  conversationSummary,
  currentAccount,
  directConversation,
  hasSession,
  isClientAccount,
  isOnline,
  messageDto,
  messageStore,
  messagesOf,
  onUserMessage,
  profileOf,
  setOnline,
  type UserMessageEvent,
} from './db'
import {
  SCRIPTED_REPLIES,
  SCRIPTED_REQUESTS,
  type ScriptedReply,
  type ScriptedRequest,
} from './fixtures/messaging'
import { memberOf, type StoredConversation, type StoredMessage } from './lib/messaging'

type AnyHandler = (payload: unknown) => void

const CONNECT_MS = 300
/** The other member reads the user's message after this. */
export const READ_AFTER_MS = 1_200
/** Someone offline comes online first, then reads after this. */
const ONLINE_AFTER_MS = 800
/** "typing…" starts after the reading, is sent again this often, and lasts this long. */
const TYPING_AFTER_READ_MS = 400
const TYPING_EVERY_MS = 1_200
const TYPING_FOR_MS = 3_600
/** The thread just opened, K. Atangana starts typing (screen 11). */
const TYPING_ON_OPEN_MS = 600
/** Someone who came online to answer leaves a minute later. */
const OFFLINE_AFTER_MS = 60_000
/** A contact request reaches the user this long after login. */
export const REQUEST_AFTER_MS = 30_000

/** The user of this tab, or null once logged out. */
function sessionUser() {
  try {
    return hasSession() ? currentAccount() : null
  } catch {
    return null
  }
}

const conversationOf = (conversations: StoredConversation[], id: string) =>
  conversations.find((conversation) => conversation.id === id)

/** The hub tells the presence of the people who show it only (spec section 15). */
function showsOnline(userId: string): boolean {
  const account = anyAccount(userId)
  return Boolean(
    account && isClientAccount(account) && profileOf(account).privacy.show.onlineStatus,
  )
}

/** The conversation is open for this member: no block, no request waiting. */
function isOpenFor(conversationId: string, userId: string): boolean {
  const conversation = conversationOf(conversationStore.read(), conversationId)
  return conversation !== undefined && conversationSummary(conversation, userId).state === 'open'
}

/**
 * `userId` reads the open conversation up to its last message: that message's id, or null when
 * nothing of the others was left to read.
 */
function readAs(conversationId: string, userId: string): string | null {
  const conversations = conversationStore.read()
  const conversation = conversationOf(conversations, conversationId)
  const member = conversation && memberOf(conversation, userId)
  if (!member || !isOpenFor(conversationId, userId)) return null
  const messages = messagesOf(conversationId).sort((a, b) => a.sentAt.localeCompare(b.sentAt))
  const unread = messages.some(
    (message) =>
      message.authorId !== userId &&
      (member.lastReadAt === null || message.sentAt > member.lastReadAt),
  )
  const last = messages.at(-1)
  if (!unread || !last) return null
  member.lastReadAt = last.sentAt
  conversationStore.write(conversations)
  return last.id
}

/** The reply scripted for the conversation, if its author has not sent it and may write. */
function dueReply(
  conversationId: string,
  on: ScriptedReply['on'],
  userId: string,
  running: ReadonlySet<string>,
): ScriptedReply | undefined {
  const conversation = conversationOf(conversationStore.read(), conversationId)
  if (!conversation || !memberOf(conversation, userId)) return undefined
  const sent = new Set(messagesOf(conversationId).map((message) => message.id))
  return SCRIPTED_REPLIES.find(
    (script) =>
      script.conversationId === conversationId &&
      script.on === on &&
      script.authorId !== userId &&
      !sent.has(script.id) &&
      !running.has(script.id) &&
      isOpenFor(conversationId, script.authorId),
  )
}

/** The scripted reply, stored, as the user sees it; null when its author can no longer write. */
function sendReply(script: ScriptedReply, userId: string): MessageDto | null {
  const conversations = conversationStore.read()
  const conversation = conversationOf(conversations, script.conversationId)
  if (!conversation || !isOpenFor(conversation.id, script.authorId)) return null
  if (messagesOf(conversation.id).some((message) => message.id === script.id)) return null
  const sentAt = new Date().toISOString()
  const message: StoredMessage = {
    id: script.id,
    conversationId: conversation.id,
    authorId: script.authorId,
    text: script.text,
    sentAt,
    editedAt: null,
    deletedAt: null,
    attachmentIds: [],
    shared: null,
  }
  messageStore.write([...messageStore.read(), message])
  const author = memberOf(conversation, script.authorId)
  if (author) author.lastReadAt = sentAt
  conversation.updatedAt = sentAt
  conversationStore.write(conversations)
  return messageDto(message, conversation, userId)
}

/**
 * Simulates the /hubs/chat SignalR hub with the same messages (spec section 10). The people of
 * the mockup read the user's messages when online, and answer once as fixtures/messaging.ts
 * scripts it, typing first; "typing…" goes to the threads joined, the rest to every member.
 */
export function createMockChatClient(): ChatClient {
  const handlers = new Map<ChatEventName, Set<AnyHandler>>()
  const stateListeners = new Set<(state: ConnectionState) => void>()
  const joined = new Set<string>()
  /** The scripted replies under way, and the people who came online to send them. */
  const running = new Set<string>()
  const visitors = new Set<string>()
  const timers = new Set<number>()
  /** A stop during the connection cancels it. */
  let generation = 0
  let state: ConnectionState = 'disconnected'
  let stopMessages: (() => void) | null = null

  function setState(next: ConnectionState) {
    state = next
    stateListeners.forEach((listener) => listener(next))
  }

  function emit<E extends ChatEventName>(event: E, payload: ChatEventMap[E]) {
    handlers.get(event)?.forEach((handler) => handler(payload))
  }

  /** Runs `action` after `ms`, unless the hub stops first. */
  function later(ms: number, action: () => void) {
    const timer = window.setTimeout(() => {
      timers.delete(timer)
      action()
    }, ms)
    timers.add(timer)
  }

  function presence(userId: string, online: boolean) {
    if (setOnline(userId, online) && showsOnline(userId))
      emit('PresenceChanged', { userId, online })
  }

  function read(conversationId: string, userId: string) {
    const lastReadMessageId = readAs(conversationId, userId)
    if (lastReadMessageId) emit('ReadReceipt', { conversationId, userId, lastReadMessageId })
  }

  /**
   * The author comes online if needed, reads the conversation, types, then answers; a block or
   * the end of the conversation meanwhile stops them.
   */
  function play(script: ScriptedReply, userId: string, after: number) {
    const { conversationId, authorId } = script
    const open = () => isOpenFor(conversationId, authorId)
    running.add(script.id)
    let at = after
    const visiting = !isOnline(authorId)
    if (visiting) {
      visitors.add(authorId)
      later(at, () => {
        if (open()) presence(authorId, true)
      })
      at += ONLINE_AFTER_MS
    }
    later(at, () => read(conversationId, authorId))
    at += TYPING_AFTER_READ_MS
    for (let typing = 0; typing < TYPING_FOR_MS; typing += TYPING_EVERY_MS) {
      later(at + typing, () => {
        if (joined.has(conversationId) && open()) {
          emit('TypingIndicator', { conversationId, userId: authorId })
        }
      })
    }
    later(at + TYPING_FOR_MS, () => {
      running.delete(script.id)
      const message = sendReply(script, userId)
      if (message) emit('MessageReceived', { conversationId, message })
      if (visiting) {
        later(OFFLINE_AFTER_MS, () => {
          visitors.delete(authorId)
          presence(authorId, false)
        })
      }
    })
  }

  // The user wrote: the other member reads it when online, or answers as scripted.
  function answerUser({ conversationId }: UserMessageEvent) {
    const user = sessionUser()
    const conversation = conversationOf(conversationStore.read(), conversationId)
    if (!user || !conversation || conversation.kind !== 'direct') return
    const otherId = conversation.members.find((member) => member.userId !== user.id)?.userId
    // A request waits for its recipient, who does not read it here.
    if (!otherId || conversationSummary(conversation, otherId).state !== 'open') return
    const script = dueReply(conversationId, 'answer', user.id, running)
    if (script) play(script, user.id, READ_AFTER_MS)
    else if (isOnline(otherId)) later(READ_AFTER_MS, () => read(conversationId, otherId))
  }

  /** A contact request, or a message when the user's rules let the sender write at once. */
  function deliverRequest(script: ScriptedRequest) {
    const user = sessionUser()
    const sender = anyAccount(script.from)
    if (!user || user.id !== script.to || !sender) return
    const conversations = conversationStore.read()
    if (conversationOf(conversations, script.id) || directConversation(sender.id, user.id)) return
    const mode = contactModeFor(sender, user)
    if (mode === 'none') return
    const now = new Date().toISOString()
    const conversation: StoredConversation = {
      id: script.id,
      kind: 'direct',
      title: null,
      createdBy: sender.id,
      createdAt: now,
      members: [sender.id, user.id].map((userId) => ({
        userId,
        joinedAt: now,
        leftAt: null,
        lastReadAt: userId === sender.id ? now : null,
        muted: false,
      })),
      request: mode === 'request' ? { to: user.id, status: 'pending' } : null,
      updatedAt: now,
    }
    const message: StoredMessage = {
      id: `${script.id}-1`,
      conversationId: script.id,
      authorId: sender.id,
      text: script.text,
      sentAt: now,
      editedAt: null,
      deletedAt: null,
      attachmentIds: [],
      shared: null,
    }
    conversationStore.write([...conversations, conversation])
    messageStore.write([...messageStore.read(), message])
    if (conversation.request) {
      emit('ContactRequestReceived', {
        conversationId: script.id,
        fromUserId: sender.id,
        fromType: sender.accountType,
      })
    } else {
      emit('MessageReceived', {
        conversationId: script.id,
        message: messageDto(message, conversation, user.id),
      })
    }
  }

  return {
    get state() {
      return state
    },
    async start() {
      if (state !== 'disconnected') return
      generation += 1
      const current = generation
      setState('connecting')
      await new Promise((resolve) => window.setTimeout(resolve, CONNECT_MS))
      if (current !== generation) return
      setState('connected')
      stopMessages = onUserMessage(answerUser)
      const user = sessionUser()
      SCRIPTED_REQUESTS.filter((script) => script.to === user?.id).forEach((script) =>
        later(REQUEST_AFTER_MS, () => deliverRequest(script)),
      )
    },
    async stop() {
      generation += 1
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
      running.clear()
      joined.clear()
      // Who came online to answer leaves with the session.
      visitors.forEach((userId) => setOnline(userId, false))
      visitors.clear()
      stopMessages?.()
      stopMessages = null
      if (state !== 'disconnected') setState('disconnected')
    },
    async joinConversation(conversationId) {
      // While disconnected: the app joins again once connected.
      if (state !== 'connected') return
      joined.add(conversationId)
      const user = sessionUser()
      const script = user && dueReply(conversationId, 'open', user.id, running)
      if (user && script) play(script, user.id, TYPING_ON_OPEN_MS)
    },
    async leaveConversation(conversationId) {
      joined.delete(conversationId)
    },
    // The simulated people do not read "typing…".
    async typing() {},
    on(event, handler) {
      let eventHandlers = handlers.get(event)
      if (!eventHandlers) {
        eventHandlers = new Set()
        handlers.set(event, eventHandlers)
      }
      const anyHandler = handler as unknown as AnyHandler
      eventHandlers.add(anyHandler)
      return () => eventHandlers.delete(anyHandler)
    },
    onStateChange(listener) {
      stateListeners.add(listener)
      return () => stateListeners.delete(listener)
    },
  }
}
