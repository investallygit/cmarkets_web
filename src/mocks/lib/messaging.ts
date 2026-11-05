import type {
  AccountType,
  ConversationFilter,
  ConversationKind,
  ConversationState,
  FrozenChartPeriod,
  SharedObjectDto,
  SharedObjectInputDto,
} from '@/shared/api/contracts'
import { normalize } from './text'

/**
 * The rules of the messaging (spec section 15): what a conversation is for each member, the
 * unread messages, the history a page at a time, the edits, the search and the limits.
 */

export const MESSAGE_MAX_LENGTH = 4000
export const EDIT_WINDOW_MS = 15 * 60_000
/** A group, its creator included. */
export const GROUP_MAX_MEMBERS = 50
export const GROUP_TITLE_MAX_LENGTH = 60
/** New conversations a day; the Admin's to change (step 18 of the roadmap). */
export const DAILY_CONVERSATIONS = 20
export const STUDENT_DAILY_CONVERSATIONS = 5
export const PAGE_LIMIT = 50
export const ATTACHMENTS_MAX = 5
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
/** PDF, XLSX, CSV, PNG and JPEG (spec section 15). */
export const ATTACHMENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}
/** How long the virus scan of the prototype takes. */
export const SCAN_MS = 2_000

export interface StoredMember {
  userId: string
  joinedAt: string
  /** Left the group, or was taken out of it. */
  leftAt: string | null
  /** Everything sent until then is read. */
  lastReadAt: string | null
  muted: boolean
}

export interface StoredConversation {
  id: string
  kind: ConversationKind
  /** A group's name. */
  title: string | null
  createdBy: string
  createdAt: string
  members: StoredMember[]
  /** A direct conversation opened by a contact request, until the recipient answers it. */
  request: { to: string; status: 'pending' | 'accepted' | 'declined' } | null
  updatedAt: string
}

export interface StoredMessage {
  id: string
  conversationId: string
  authorId: string
  text: string
  sentAt: string
  editedAt: string | null
  deletedAt: string | null
  attachmentIds: string[]
  shared: SharedObjectDto | null
}

export const activeMembers = (conversation: StoredConversation) =>
  conversation.members.filter((member) => member.leftAt === null)

export const memberOf = (conversation: StoredConversation, userId: string) =>
  conversation.members.find((member) => member.userId === userId)

/**
 * The conversation for one of its members: a request waits for its recipient, who alone sees
 * it as received; a block closes a direct conversation, leaving a group closes it for the one
 * who left. A declined request stays sent, as the sender is not told.
 */
export function conversationState(
  conversation: StoredConversation,
  userId: string,
  blocked: boolean,
): ConversationState {
  const member = memberOf(conversation, userId)
  if (!member || member.leftAt !== null || blocked) return 'closed'
  const { request } = conversation
  if (request && request.status !== 'accepted') {
    return request.to === userId ? 'requestReceived' : 'requestSent'
  }
  return 'open'
}

/** Messages of others after the member last read, not deleted. */
export function unreadCount(messages: readonly StoredMessage[], member: StoredMember): number {
  return messages.filter(
    (message) =>
      message.authorId !== member.userId &&
      message.deletedAt === null &&
      (member.lastReadAt === null || message.sentAt > member.lastReadAt),
  ).length
}

/** Read by every other member still in the conversation. */
export function readByAll(message: StoredMessage, conversation: StoredConversation): boolean {
  return activeMembers(conversation)
    .filter((member) => member.userId !== message.authorId)
    .every((member) => member.lastReadAt !== null && member.lastReadAt >= message.sentAt)
}

export function isEditable(message: StoredMessage, userId: string, now: number): boolean {
  return (
    message.authorId === userId &&
    message.deletedAt === null &&
    now - Date.parse(message.sentAt) <= EDIT_WINDOW_MS
  )
}

/** The history a page at a time, the newest page first: the `limit` messages before `before`. */
export function pageOf(
  messages: readonly StoredMessage[],
  before: string | null,
  limit = PAGE_LIMIT,
): { items: StoredMessage[]; hasMore: boolean } {
  const sorted = [...messages].sort((a, b) => a.sentAt.localeCompare(b.sentAt))
  const end = before ? sorted.findIndex((message) => message.id === before) : sorted.length
  const last = end < 0 ? sorted.length : end
  const start = Math.max(0, last - limit)
  return { items: sorted.slice(start, last), hasMore: start > 0 }
}

/** Does a row of the list belong to a tab: Unread, Requests (received) or Groups. */
export function inFilter(
  filter: ConversationFilter,
  row: { kind: ConversationKind; unreadCount: number; state: ConversationState },
): boolean {
  if (filter === 'unread') return row.unreadCount > 0
  if (filter === 'requests') return row.state === 'requestReceived'
  if (filter === 'groups') return row.kind === 'group'
  return true
}

const EXCERPT_RADIUS = 40

/** The words of the query in the text, without accents or case, and the text around them. */
export function matchExcerpt(text: string, q: string): string | null {
  const words = normalize(q).split(' ').filter(Boolean)
  const haystack = normalize(text)
  if (words.length === 0 || !words.every((word) => haystack.includes(word))) return null
  // normalize() keeps one character per letter of a single-spaced text: the index maps back.
  const flat = text.replace(/\s+/g, ' ').trim()
  const at = haystack.indexOf(words[0])
  const start = Math.max(0, at - EXCERPT_RADIUS)
  const end = Math.min(flat.length, at + words[0].length + EXCERPT_RADIUS)
  return `${start > 0 ? '…' : ''}${flat.slice(start, end)}${end < flat.length ? '…' : ''}`
}

/** New conversations a day: 20, or 5 for a Student. */
export const dailyConversations = (accountType: AccountType) =>
  accountType === 'student' ? STUDENT_DAILY_CONVERSATIONS : DAILY_CONVERSATIONS

/** Conversations the user opened since the start of the day, in the time zone given. */
export function openedToday(
  conversations: readonly StoredConversation[],
  userId: string,
  today: string,
  dayOf: (iso: string) => string,
): number {
  return conversations.filter(
    (conversation) => conversation.createdBy === userId && dayOf(conversation.createdAt) === today,
  ).length
}

const CHART_PERIODS: readonly FrozenChartPeriod[] = ['1M', '3M', '6M', '1Y', '5Y']

export interface MessageInput {
  text: string
  attachmentIds: string[]
  shared: SharedObjectInputDto | null
}

/** Checks the body of a message: text, files or an object, within the limits. */
export function readMessage(body: unknown): {
  errors: Record<string, string[]>
  message: MessageInput
} {
  const input = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
  const errors: Record<string, string[]> = {}
  const text = typeof input.text === 'string' ? input.text.trim() : ''
  const attachmentIds = Array.isArray(input.attachmentIds)
    ? input.attachmentIds.filter((id): id is string => typeof id === 'string')
    : []
  const shared = readShared(input.shared)
  if (input.shared !== undefined && input.shared !== null && !shared) {
    errors.shared = ['A security, a chart or a publication.']
  }
  if (text.length > MESSAGE_MAX_LENGTH) {
    errors.text = [`${MESSAGE_MAX_LENGTH} characters at most.`]
  }
  if (!text && attachmentIds.length === 0 && !shared) errors.text = ['Write a message.']
  if (attachmentIds.length > ATTACHMENTS_MAX) {
    errors.attachmentIds = [`${ATTACHMENTS_MAX} files at most.`]
  }
  return { errors, message: { text, attachmentIds, shared } }
}

function readShared(value: unknown): SharedObjectInputDto | null {
  if (typeof value !== 'object' || value === null) return null
  const shared = value as Record<string, unknown>
  if (shared.type === 'security' && typeof shared.securityId === 'string') {
    return { type: 'security', securityId: shared.securityId }
  }
  if (shared.type === 'chart' && typeof shared.securityId === 'string') {
    const period = CHART_PERIODS.find((candidate) => candidate === shared.period)
    return period ? { type: 'chart', securityId: shared.securityId, period } : null
  }
  if (shared.type === 'publication' && typeof shared.publicationId === 'string') {
    return { type: 'publication', publicationId: shared.publicationId }
  }
  return null
}

/** The extension of a file name, which tells its type: "Note.PDF" gives "pdf". */
export const extensionOf = (fileName: string) =>
  (fileName.split('.').length > 1 ? fileName.split('.').at(-1) : '')?.toLowerCase() ?? ''
