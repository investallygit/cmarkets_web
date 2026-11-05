import type {
  ConversationDto,
  ConversationMemberDto,
  ConversationSummaryDto,
  FrozenChartPeriod,
  MessageAttachmentDto,
  MessageDto,
  MessageExcerptDto,
  SharedChartDto,
  SharedObjectDto,
  SharedPublicationDto,
  SharedSecurityDto,
} from '@/shared/api/contracts'
import { periodRange } from '@/shared/lib/chartPeriods'
import { toMarketDay } from '@/shared/lib/format'
import { xlsxBlob } from '@/shared/lib/xlsx'
import type { StoredAccount } from '../fixtures/accounts'
import { bondOf } from '../fixtures/bonds'
import {
  createAttachments,
  createConversations,
  SEEDED_FILES,
  type StoredAttachment,
  type StoredConversationReport,
} from '../fixtures/messaging'
import { calculateBond } from '../lib/bondMath'
import {
  activeMembers,
  conversationState,
  isEditable,
  memberOf,
  readByAll,
  unreadCount,
  type StoredConversation,
  type StoredMessage,
} from '../lib/messaging'
import { createPdf } from '../lib/pdf'
import { latestVersion } from '../lib/research'
import { anyAccount } from './accounts'
import { isOnline } from './chat'
import { startedAt, securities } from './market'
import { blockBetween, isClientAccount, profileOf, setConversationLookup } from './network'
import { analystStore, publicationStore, researchMarket } from './research'
import { readStorage, sharedStore, writeStorage } from './storage'

/**
 * The messaging of the directory (spec section 15, screen 11): the conversations and their
 * messages, the files sent, the reports; what each member sees of them.
 */

/** A bond as YAS prices it the day it is shared; an equity's last price and change. */
export function sharedSecurity(securityId: string, at: string): SharedSecurityDto | null {
  const security = securities.get(securityId)
  if (!security) return null
  const bond = security.type === 'bond' ? bondOf(security.id) : undefined
  let yieldPct: number | null = null
  let modifiedDuration: number | null = null
  if (bond) {
    try {
      const result = calculateBond(bond, {
        settlementDate: toMarketDay(Date.parse(at)),
        cleanPrice: security.last,
        faceAmount: 1_000_000,
      })
      yieldPct = Math.round(result.yieldPct * 100) / 100
      modifiedDuration = Math.round(result.modifiedDuration * 100) / 100
    } catch {
      // A bond out of its life: shared with its price alone.
    }
  }
  return {
    type: 'security',
    securityId: security.id,
    code: security.code,
    name: security.name,
    securityType: security.type,
    currency: security.currency,
    price: security.last,
    changePct:
      bond || !security.previousClose
        ? null
        : Math.round((security.last / security.previousClose - 1) * 10_000) / 100,
    yieldPct,
    modifiedDuration,
    sharedAt: at,
  }
}

/** The price chart of a period, frozen as the charts of a publication are. */
export function sharedChart(
  securityId: string,
  period: FrozenChartPeriod,
  now = Date.now(),
): SharedChartDto | null {
  const security = securities.get(securityId)
  if (!security) return null
  const range = periodRange(period, now)
  return {
    type: 'chart',
    chart: {
      id: `chart-${now.toString(36)}`,
      securityId: security.id,
      code: security.code,
      title: `${security.code} · ${period}`,
      period,
      type: 'line',
      currency: security.currency,
      frozenAt: range.to,
      bars: researchMarket(now).bars(
        security.id,
        range.from,
        range.to,
        range.interval === '1w' ? '1w' : '1d',
      ),
    },
  }
}

/** A publication of the library, its preview only: a reader who did not buy it sees no more. */
export function sharedPublication(publicationId: string): SharedPublicationDto | null {
  const publication = publicationStore.read().find((candidate) => candidate.id === publicationId)
  const content = publication && latestVersion(publication)?.content
  if (!publication || publication.status !== 'published' || !content) return null
  const analyst = analystStore.read().find((candidate) => candidate.id === publication.analystId)
  return {
    type: 'publication',
    publicationId: publication.id,
    title: content.title,
    analystName: analyst?.displayName ?? '',
    access: publication.pricing.access,
    price: publication.pricing.access === 'free' ? null : publication.pricing.price,
    summary: content.summary,
  }
}

const SEEDED_AT_KEY = 'cmarket.prototype.messagingSeededAt'

/**
 * The time the sample conversations count back from, kept on the first load: the conversations
 * and their messages are stored apart, and must agree on what was read after a reload.
 */
function seededAt(): number {
  const stored = Number(readStorage(SEEDED_AT_KEY))
  if (stored > 0) return stored
  writeStorage(SEEDED_AT_KEY, String(startedAt))
  return startedAt
}

function seeds() {
  return createConversations(seededAt(), sharedSecurity)
}

export const conversationStore = sharedStore<StoredConversation[]>(
  'conversations',
  () => seeds().conversations,
)

export const messageStore = sharedStore<StoredMessage[]>('messages', () => seeds().messages)

export const attachmentStore = sharedStore<StoredAttachment[]>('attachments', createAttachments)

export type { StoredConversationReport }

/** The reports of conversations, which let the Admin read them in MOD. */
export const conversationReportStore = sharedStore<StoredConversationReport[]>(
  'conversationReports',
  () => seeds().reports,
)

/**
 * The files' content, kept by this tab only: localStorage could not hold 10 MB files. The files
 * of the mockup are made again when downloaded.
 */
const fileContents = new Map<string, Blob>()

export function keepFileContent(attachmentId: string, content: Blob): void {
  fileContents.set(attachmentId, content)
}

const CURVE_ROWS: (string | number)[][] = [
  ['Tenor', 'Yield (%)', 'Source'],
  ['3 months', 4.1, 'BTA auction'],
  ['6 months', 4.35, 'BTA auction'],
  ['1 year', 4.6, 'BTA auction'],
  ['2 years', 5.05, 'OTA auction'],
  ['3 years', 5.3, 'OTA auction'],
  ['5 years', 5.85, 'OTA auction'],
]

/** What a file's bytes are read from: a Blob, or the bytes the mock makes. */
export interface FileContent {
  arrayBuffer(): Promise<ArrayBuffer>
}

/** The content of a file, or null when this tab no longer has it. */
export async function fileContent(attachment: StoredAttachment): Promise<FileContent | null> {
  const kept = fileContents.get(attachment.id)
  if (kept) return kept
  if (attachment.id === SEEDED_FILES.curve) return xlsxBlob(CURVE_ROWS)
  if (attachment.id === SEEDED_FILES.note) {
    const lines = [
      'Cameroon: debt trajectory 2026-2028',
      '',
      'Public debt stops rising in 2026 and starts to fall in 2027 if the budget sticks to the',
      'IMF programme. The regional market covers about 60% of the financing needs, through BTA',
      'and OTA auctions of the BEAC.',
    ]
    const pdf = createPdf('note_dette_cmr', lines)
    return { arrayBuffer: () => Promise.resolve(pdf.buffer) }
  }
  return null
}

export function attachmentDto(
  attachment: StoredAttachment,
  now = Date.now(),
): MessageAttachmentDto {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    size: attachment.size,
    contentType: attachment.contentType,
    status:
      Date.parse(attachment.availableAt) > now
        ? 'scanning'
        : attachment.infected
          ? 'infected'
          : 'available',
    uploadedAt: attachment.uploadedAt,
  }
}

// ---------------------------------------------------------------------------------------------
// What each member sees

/** Two users have a conversation: open, or a request not answered. A declined one does not count. */
function conversationOf(userId: string, otherId: string): 'open' | 'request' | null {
  const found = conversationStore
    .read()
    .find(
      (conversation) =>
        conversation.kind === 'direct' &&
        conversation.request?.status !== 'declined' &&
        memberOf(conversation, userId) &&
        memberOf(conversation, otherId),
    )
  if (!found) return null
  return found.request && found.request.status !== 'accepted' ? 'request' : 'open'
}

setConversationLookup(conversationOf)

/** The direct conversation of two users, a declined request aside. */
export function directConversation(userId: string, otherId: string) {
  return conversationStore
    .read()
    .find(
      (conversation) =>
        conversation.kind === 'direct' &&
        conversation.request?.status !== 'declined' &&
        memberOf(conversation, userId) !== undefined &&
        memberOf(conversation, otherId) !== undefined,
    )
}

/** A member; `presence` false when a block hides it, as it hides the profile (spec section 15). */
export function memberDto(account: StoredAccount, presence = true): ConversationMemberDto {
  const profile = isClientAccount(account) ? profileOf(account) : null
  return {
    userId: account.id,
    displayName: account.displayName,
    accountType: account.accountType,
    photoUrl: profile?.photo ?? null,
    verified: account.verificationStatus === 'approved',
    jobTitle: profile?.jobTitle ?? '',
    organization: profile?.organization ?? '',
    city: profile?.city ?? '',
    country: profile?.country ?? '',
    analystId: analystStore.read().find((analyst) => analyst.userId === account.id)?.id ?? null,
    online: presence && profile?.privacy.show.onlineStatus ? isOnline(account.id) : null,
  }
}

const nameOf = (userId: string) => anyAccount(userId)?.displayName ?? userId

export const messagesOf = (conversationId: string) =>
  messageStore.read().filter((message) => message.conversationId === conversationId)

/** The other member of a direct conversation. */
const counterpartOf = (conversation: StoredConversation, userId: string) =>
  conversation.kind === 'direct'
    ? conversation.members.find((member) => member.userId !== userId)?.userId
    : undefined

/** A request declined: its recipient no longer sees it, its sender is not told. */
export function isVisibleTo(conversation: StoredConversation, userId: string): boolean {
  const member = memberOf(conversation, userId)
  if (!member) return false
  return !(conversation.request?.status === 'declined' && conversation.request.to === userId)
}

function excerptOf(message: StoredMessage): MessageExcerptDto {
  const kind =
    message.deletedAt !== null
      ? 'deleted'
      : message.text
        ? 'text'
        : message.attachmentIds.length > 0
          ? 'file'
          : 'shared'
  return {
    authorId: message.authorId,
    authorName: nameOf(message.authorId),
    text: message.deletedAt === null ? message.text.slice(0, 120) : '',
    kind,
    sentAt: message.sentAt,
  }
}

export function conversationSummary(
  conversation: StoredConversation,
  userId: string,
): ConversationSummaryDto {
  const otherId = counterpartOf(conversation, userId)
  const other = otherId ? anyAccount(otherId) : undefined
  const blocked = otherId ? blockBetween(userId, otherId) : null
  const state = conversationState(conversation, userId, blocked !== null)
  const messages = messagesOf(conversation.id).sort((a, b) => a.sentAt.localeCompare(b.sentAt))
  const member = memberOf(conversation, userId)
  const last = messages.at(-1)
  return {
    id: conversation.id,
    kind: conversation.kind,
    title: conversation.title ?? other?.displayName ?? '',
    counterpart: other ? memberDto(other, blocked === null) : null,
    memberCount: activeMembers(conversation).length,
    lastMessage: last ? excerptOf(last) : null,
    // A request has a tab of its own: it does not count among the unread.
    unreadCount: member && state === 'open' ? unreadCount(messages, member) : 0,
    state,
    muted: member?.muted ?? false,
    updatedAt: conversation.updatedAt,
  }
}

export function conversationDto(conversation: StoredConversation, userId: string): ConversationDto {
  const summary = conversationSummary(conversation, userId)
  const otherId = counterpartOf(conversation, userId)
  const blocked = otherId ? blockBetween(userId, otherId) : null
  const attachmentIds = new Set(
    messagesOf(conversation.id)
      .filter((message) => message.deletedAt === null)
      .flatMap((message) => message.attachmentIds),
  )
  const files = attachmentStore
    .read()
    .filter((attachment) => attachmentIds.has(attachment.id))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .map((attachment) => attachmentDto(attachment))
  const members = activeMembers(conversation)
    .sort(
      (a, b) =>
        Number(b.userId === conversation.createdBy) - Number(a.userId === conversation.createdBy),
    )
    .flatMap((member) => {
      const account = anyAccount(member.userId)
      return account ? [memberDto(account, blocked === null)] : []
    })
  const sentByUser = messagesOf(conversation.id).some((message) => message.authorId === userId)
  return {
    ...summary,
    createdBy: conversation.createdBy,
    createdAt: conversation.createdAt,
    members,
    blocked,
    // The sender of a request waits for the answer once the first message is sent.
    canWrite: summary.state === 'open' || (summary.state === 'requestSent' && !sentByUser),
    files,
  }
}

export function messageDto(
  message: StoredMessage,
  conversation: StoredConversation,
  userId: string,
  now = Date.now(),
): MessageDto {
  const author = anyAccount(message.authorId)
  const deleted = message.deletedAt !== null
  const attachments = attachmentStore.read()
  const own = message.authorId === userId
  return {
    id: message.id,
    conversationId: message.conversationId,
    author: {
      userId: message.authorId,
      displayName: author?.displayName ?? message.authorId,
      accountType: author?.accountType ?? 'student',
    },
    text: deleted ? '' : message.text,
    sentAt: message.sentAt,
    editedAt: message.editedAt,
    deleted,
    attachments: deleted
      ? []
      : message.attachmentIds.flatMap((id) => {
          const attachment = attachments.find((candidate) => candidate.id === id)
          return attachment ? [attachmentDto(attachment, now)] : []
        }),
    shared: deleted ? null : (message.shared as SharedObjectDto | null),
    readByAll: own ? readByAll(message, conversation) : null,
    editable: isEditable(message, userId, now),
  }
}
