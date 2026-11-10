import type { CurrencyCode, IsoDateTime } from './common'
import type { AccountType } from './me'
import type { NewsItemSourceDto, NewsType } from './news'
import type { FrozenChartDto, FrozenChartPeriod, PublicationAccess } from './research'
import type { SecurityType } from './securities'

/** One person, or a group of up to 50 (spec section 15). */
export type ConversationKind = 'direct' | 'group'

/** The tabs of the conversations: All / Unread / Requests / Groups (spec section 9, screen 11). */
export type ConversationFilter = 'all' | 'unread' | 'requests' | 'groups'

/**
 * Where the conversation stands for the user: open; a contact request received, waiting for the
 * user's answer; a request sent, waiting for the other's; closed by a block either way, or a
 * group the user left.
 */
export type ConversationState = 'open' | 'requestReceived' | 'requestSent' | 'closed'

/** A member as a conversation shows them: the card of the directory, briefly. */
export interface ConversationMemberDto {
  userId: string
  displayName: string
  accountType: AccountType
  photoUrl: string | null
  verified: boolean
  jobTitle: string
  organization: string
  city: string
  country: string
  /** An Analyst's id in the research library, for "Their publications"; null otherwise. */
  analystId: string | null
  /**
   * Online now, which the hub keeps current (PresenceChanged); null when the member does not show
   * their online status (spec section 15).
   */
  online: boolean | null
}

/** What the list says of the last message: "T. Bekale: the Cameroon 5-yr OTA is very...". */
export interface MessageExcerptDto {
  authorId: string
  authorName: string
  /** The text, cut; empty for a file or a shared object alone. */
  text: string
  kind: 'text' | 'file' | 'shared' | 'deleted'
  sentAt: IsoDateTime
}

/** GET /conversations: a row of the list. */
export interface ConversationSummaryDto {
  id: string
  kind: ConversationKind
  /** The group's name, or the other member's display name. */
  title: string
  /** The other member of a direct conversation; null for a group. */
  counterpart: ConversationMemberDto | null
  memberCount: number
  lastMessage: MessageExcerptDto | null
  unreadCount: number
  state: ConversationState
  muted: boolean
  updatedAt: IsoDateTime
}

/** A file sent in a conversation, available once the virus scan found nothing (spec section 15). */
export interface MessageAttachmentDto {
  id: string
  fileName: string
  size: number
  contentType: string
  status: 'scanning' | 'available' | 'infected'
  uploadedAt: IsoDateTime
}

/** GET /conversations/{id}: details and members. */
export interface ConversationDto extends ConversationSummaryDto {
  createdBy: string
  createdAt: IsoDateTime
  /** Present members, the creator first. */
  members: ConversationMemberDto[]
  /** A block between the two of a direct conversation, which closes it. */
  blocked: 'byMe' | 'byThem' | null
  /** The user may write: open, or the first message of a request already sent. */
  canWrite: boolean
  /** The files of the conversation, the newest first. */
  files: MessageAttachmentDto[]
}

/** A security as it stood when shared: a bond with what YAS computes. */
export interface SharedSecurityDto {
  type: 'security'
  securityId: string
  code: string
  name: string
  securityType: SecurityType
  currency: CurrencyCode
  /** The last price; a bond's clean price, in percent. */
  price: number
  changePct: number | null
  /** A bond's yield and modified duration at that price. */
  yieldPct: number | null
  modifiedDuration: number | null
  sharedAt: IsoDateTime
}

/** A price chart frozen when shared, as the charts of a publication are. */
export interface SharedChartDto {
  type: 'chart'
  chart: FrozenChartDto
}

/** A publication of the library: its preview, whatever the reader bought (spec section 15). */
export interface SharedPublicationDto {
  type: 'publication'
  publicationId: string
  title: string
  analystName: string
  access: PublicationAccess
  /** XAF; null when free. */
  price: number | null
  summary: string
}

/**
 * A news item as it read when shared: its tags, subject and headline. Its card opens the item at
 * its own address, where the recipient reads the content as it stands.
 */
export interface SharedNewsDto {
  type: 'news'
  newsId: string
  publishedAt: IsoDateTime
  /** ARTICLE or FLASH: `type` names the shared object. */
  newsType: NewsType
  source: NewsItemSourceDto
  /** Issuer code or institution, shown in amber: SEMC, BEAC, COSUMAF; null when none. */
  subject: string | null
  headline: string
}

export type SharedObjectDto =
  SharedSecurityDto | SharedChartDto | SharedPublicationDto | SharedNewsDto

/** What a message shares; the server reads the object and keeps it as it is then. */
export type SharedObjectInputDto =
  | { type: 'security'; securityId: string }
  | { type: 'chart'; securityId: string; period: FrozenChartPeriod }
  | { type: 'publication'; publicationId: string }
  | { type: 'news'; newsId: string }

export interface MessageAuthorDto {
  userId: string
  displayName: string
  accountType: AccountType
}

/** A message of the history. */
export interface MessageDto {
  id: string
  conversationId: string
  author: MessageAuthorDto
  /** Empty once deleted. */
  text: string
  sentAt: IsoDateTime
  editedAt: IsoDateTime | null
  deleted: boolean
  attachments: MessageAttachmentDto[]
  shared: SharedObjectDto | null
  /** The user's own message: read by every other member (✓✓) or not yet (✓); null for others'. */
  readByAll: boolean | null
  /** The user's own message, sent less than 15 minutes ago and not deleted. */
  editable: boolean
}

/** GET /conversations/{id}/messages?before=&limit=50: the oldest first. */
export interface MessagePageDto {
  items: MessageDto[]
  /** Older messages remain: ask again with `before` the first id. */
  hasMore: boolean
}

/** POST /conversations/{id}/messages: 4,000 characters, files of POST /attachments, one object. */
export interface SendMessageDto {
  text: string
  attachmentIds?: string[]
  shared?: SharedObjectInputDto | null
}

/**
 * POST /conversations: the people and the first message; a title makes a group. 403 when a
 * contact rule refuses, a request when one asks for it, 429 past the new conversations of a day.
 */
export interface NewConversationDto {
  participantIds: string[]
  title?: string | null
  message: SendMessageDto
}

/** PUT /conversations/{id}/messages/{messageId}: within 15 minutes of sending. */
export interface EditMessageDto {
  text: string
}

/** POST /conversations/{id}/read: read up to this message. */
export interface ReadUpToDto {
  messageId: string
}

/** POST /conversations/{id}/mute */
export interface MuteDto {
  muted: boolean
}

/** GET /messages/search?q=: a message of the user's conversations. */
export interface MessageSearchHitDto {
  messageId: string
  conversationId: string
  conversationTitle: string
  authorName: string
  /** The text around the match. */
  excerpt: string
  sentAt: IsoDateTime
}

export type ConversationReportReason = 'spam' | 'harassment' | 'scam' | 'inappropriate' | 'other'

/** POST /conversations/{id}/report: the Admin may then read it (spec section 15). */
export interface ConversationReportDto {
  reason: ConversationReportReason
  comment: string
}

/** GET /me/blocks: the people the user blocked. */
export interface BlockedUserDto {
  userId: string
  displayName: string
  accountType: AccountType
  blockedAt: IsoDateTime
}
