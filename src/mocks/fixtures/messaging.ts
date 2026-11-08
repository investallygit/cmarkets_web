import type { ConversationReportReason, SharedSecurityDto } from '@/shared/api/contracts'
import type { StoredConversation, StoredMember, StoredMessage } from '../lib/messaging'
import { OPEN_REPORT, type ReportState } from '../lib/reports'
import { DEMO_USERS } from './users'

/**
 * The conversations of the screen 11 mockup, as P. Owona sees them: K. Atangana's thread with
 * its bond, the rates desk of the traders, M. Ndong, S. Mvondo's request, R. Tamba, E. Fouda;
 * those of K. Atangana, whose session the end-to-end tests use; and the one T. Bekale reported.
 */

/** A file sent in a conversation; its content is made when downloaded. */
export interface StoredAttachment {
  id: string
  ownerId: string
  fileName: string
  size: number
  contentType: string
  uploadedAt: string
  /** The scan ends then. */
  availableAt: string
  infected: boolean
}

const OWONA = DEMO_USERS.manager.id
const ATANGANA = DEMO_USERS.analyst.id
const MVONDO = DEMO_USERS.student.id
const TAMBA = DEMO_USERS.journalist.id
const FOUDA = DEMO_USERS.ceo.id
const BEKALE = DEMO_USERS.trader.id
const NDONG = 'user-ndong'
const NGONO = 'user-ngono'
const ELLA = 'user-ella'
const EYINGA = 'user-eyinga'
const ABESSOLO = 'user-abessolo'

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

/** Online when the prototype loads: the green dots of the screen 11 mockup. */
export const ONLINE_AT_START = [ATANGANA, NDONG]

/**
 * What the people of the mockup answer through the simulated hub, once each: when the other
 * member opens the thread, as K. Atangana types then answers on screen 11, or after a message of
 * theirs. Someone offline comes online to answer.
 */
export interface ScriptedReply {
  /** The id of the message sent, which also marks the reply as done. */
  id: string
  conversationId: string
  authorId: string
  on: 'open' | 'answer'
  text: string
}

// prettier-ignore
export const SCRIPTED_REPLIES: ScriptedReply[] = [
  { id: 'conversation-atangana-reply', conversationId: 'conversation-atangana', authorId: ATANGANA, on: 'open', text: "It will include Wednesday's 5-year OTA auction, which should confirm the steepening you expect." },
  { id: 'conversation-tamba-atangana-reply', conversationId: 'conversation-tamba-atangana', authorId: TAMBA, on: 'answer', text: "Perfect, thank you. I'll call you tomorrow at 10." },
  { id: 'conversation-ndong-reply', conversationId: 'conversation-ndong', authorId: NDONG, on: 'answer', text: "I'll come back to you on this after the budget debate in parliament next week." },
]

/** A contact request that reaches the user some time after login, once: ContactRequestReceived. */
export interface ScriptedRequest {
  /** The id of the conversation it opens. */
  id: string
  from: string
  to: string
  text: string
}

// prettier-ignore
export const SCRIPTED_REQUESTS: ScriptedRequest[] = [
  { id: 'conversation-mvondo-atangana', from: MVONDO, to: ATANGANA, text: "Hello, I'm writing my master's thesis on the BVMAC. Could I ask you two questions on the listed agribusiness stocks?" },
]

export const SEEDED_FILES = {
  note: 'attachment-note-dette-cmr',
  curve: 'attachment-courbe-cmr',
} as const

export function createAttachments(): StoredAttachment[] {
  const file = (
    id: string,
    ownerId: string,
    fileName: string,
    size: number,
    contentType: string,
    uploadedAt: string,
  ): StoredAttachment => ({
    id,
    ownerId,
    fileName,
    size,
    contentType,
    uploadedAt,
    availableAt: uploadedAt,
    infected: false,
  })
  return [
    file(
      SEEDED_FILES.note,
      ATANGANA,
      'note_dette_cmr.pdf',
      184_320,
      'application/pdf',
      '2026-10-22T13:05:00Z',
    ),
    file(
      SEEDED_FILES.curve,
      ATANGANA,
      'courbe_cmr_oct26.xlsx',
      22_528,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '2026-10-28T08:12:00Z',
    ),
  ]
}

/** A report of a conversation, which lets the Admin read it in MOD. */
export interface StoredConversationReport extends ReportState {
  id: string
  conversationId: string
  reporterId: string
  reason: ConversationReportReason
  comment: string
  at: string
}

interface Seed {
  id: string
  kind: 'direct' | 'group'
  title?: string
  createdBy: string
  /** Members and the last message each one read, by its index; -1: none. */
  read: Record<string, number>
  request?: { to: string; status: 'pending' }
  /** Author, text, then minutes before now or an ISO time. */
  messages: [author: string, text: string, at: number | string, extra?: Partial<StoredMessage>][]
}

/**
 * The conversations, their messages and the report of T. Bekale, the times of today counted back
 * from `now`. The reported conversation keeps fixed times, as the reports of the profiles do
 * (fixtures/network.ts): MOD lists Y. Abessolo's profile, reported last, before it, whatever the
 * day.
 */
export function createConversations(
  now: number,
  bond: (securityId: string, at: string) => SharedSecurityDto | null,
): {
  conversations: StoredConversation[]
  messages: StoredMessage[]
  reports: StoredConversationReport[]
} {
  const at = (when: number | string) =>
    typeof when === 'string' ? when : new Date(now - when * MINUTE).toISOString()
  const today = (minutes: number) => minutes
  const daysAgo = (days: number, minutes = 0) => (days * DAY) / MINUTE + minutes
  const bondShared = bond('ECMR-6.25-2029', at(today(40)))

  // prettier-ignore
  const seeds: Seed[] = [
    {
      id: 'conversation-atangana', kind: 'direct', createdBy: ATANGANA, read: { [OWONA]: 7, [ATANGANA]: 6 },
      messages: [
        [ATANGANA, 'Here is my note on the debt of Cameroon, as promised.', '2026-10-22T13:05:00Z', { attachmentIds: [SEEDED_FILES.note] }],
        [OWONA, 'Received, thanks.', '2026-10-22T13:20:00Z'],
        [ATANGANA, 'The curve I use for Cameroon, with the October auctions.', '2026-10-28T08:12:00Z', { attachmentIds: [SEEDED_FILES.curve] }],
        [OWONA, "Hello, I read your analysis of Cameroon's debt. What assumption do you use for 2027 refinancing?", today(71)],
        [ATANGANA, 'Hello. I assume greater use of the regional market: about 60% of needs through BTA and OTA.', today(58)],
        [OWONA, "In that case, the 2-to-5-year slope of the curve should steepen. Here is the bond I'm looking at:", today(40), { shared: bondShared }],
        [OWONA, 'Interesting. Could you send me your reference curve?', today(3)],
        [ATANGANA, "Thanks, I'll send you the curve tonight.", today(1)],
      ],
    },
    {
      id: 'conversation-rates-desk', kind: 'group', title: 'CEMAC rates desk', createdBy: BEKALE,
      read: { [BEKALE]: 2, [OWONA]: 0, [NGONO]: 1, [ELLA]: 0 },
      messages: [
        [ELLA, "The BEAC auction of Gabon's 3-year OTA is on Wednesday.", daysAgo(1, 90)],
        [NGONO, 'We bid at 6.40% last time; the demand was strong.', today(45)],
        [BEKALE, 'The Cameroon 5-yr OTA is very much in demand this morning: two bids above 101.', today(30)],
      ],
    },
    {
      id: 'conversation-ndong', kind: 'direct', createdBy: OWONA, read: { [OWONA]: 0, [NDONG]: 1 },
      messages: [
        [OWONA, 'What oil price does the 2027 budget of Gabon assume?', '2026-10-30T15:40:00Z'],
        [NDONG, "Gabon's budget assumes $70 a barrel; every $5 below costs about 0.4% of GDP.", today(44)],
      ],
    },
    {
      id: 'conversation-mvondo', kind: 'direct', createdBy: MVONDO, read: { [MVONDO]: 0, [OWONA]: -1 },
      request: { to: OWONA, status: 'pending' },
      messages: [
        [MVONDO, "Hello, I'm preparing a master's thesis on the bond market of the CEMAC and would like your view on the funds that buy OTA. Could we talk for 20 minutes?", daysAgo(1, 200)],
      ],
    },
    {
      id: 'conversation-tamba', kind: 'direct', createdBy: TAMBA, read: { [TAMBA]: 0, [OWONA]: 0 },
      messages: [
        [TAMBA, 'Could you comment on the results of the last BEAC auctions for an article this week?', daysAgo(1, 320)],
      ],
    },
    {
      id: 'conversation-fouda', kind: 'direct', createdBy: OWONA, read: { [OWONA]: 1, [FOUDA]: 1 },
      messages: [
        [OWONA, "Can we review the bond fund's allocation this week?", '2026-10-27T08:30:00Z'],
        [FOUDA, 'Meeting confirmed for Thursday 3 pm.', '2026-10-27T09:05:00Z'],
      ],
    },
    {
      id: 'conversation-eyinga', kind: 'direct', createdBy: EYINGA, read: { [EYINGA]: 0, [ATANGANA]: -1 },
      request: { to: ATANGANA, status: 'pending' },
      messages: [
        [EYINGA, 'Hello, I study finance at University B. How would you start covering CEMAC equities?', daysAgo(1, 150)],
      ],
    },
    {
      id: 'conversation-tamba-atangana', kind: 'direct', createdBy: TAMBA, read: { [TAMBA]: 2, [ATANGANA]: 1 },
      messages: [
        [TAMBA, 'Your note on Congo was quoted in our Monday edition.', daysAgo(3, 60)],
        [ATANGANA, 'Thank you for the quote.', daysAgo(3, 30)],
        [TAMBA, 'Would you have five minutes on the phone tomorrow, on the debt of Cameroon?', today(25)],
      ],
    },
    {
      id: 'conversation-abessolo', kind: 'direct', createdBy: ABESSOLO, read: { [ABESSOLO]: 2, [BEKALE]: 2 },
      messages: [
        [ABESSOLO, 'Hello, I trade BVMAC stocks for my clients: 30% a month, guaranteed.', '2026-11-03T17:30:00Z'],
        [ABESSOLO, 'Send me 2,000,000 XAF by mobile money today and I start tomorrow.', '2026-11-03T17:40:00Z'],
        [BEKALE, 'Nobody can guarantee 30% a month, and CMarket routes no orders. I am reporting this conversation.', '2026-11-03T18:30:00Z'],
      ],
    },
  ]

  const conversations: StoredConversation[] = []
  const messages: StoredMessage[] = []
  for (const seed of seeds) {
    const sent = seed.messages.map(([authorId, text, when, extra], index) => ({
      id: `${seed.id}-${index + 1}`,
      conversationId: seed.id,
      authorId,
      text,
      sentAt: at(when),
      editedAt: null,
      deletedAt: null,
      attachmentIds: [],
      shared: null,
      ...extra,
    }))
    const members: StoredMember[] = Object.entries(seed.read).map(([userId, index]) => ({
      userId,
      joinedAt: sent[0].sentAt,
      leftAt: null,
      lastReadAt: index < 0 ? null : sent[index].sentAt,
      muted: false,
    }))
    conversations.push({
      id: seed.id,
      kind: seed.kind,
      title: seed.title ?? null,
      createdBy: seed.createdBy,
      createdAt: sent[0].sentAt,
      members,
      request: seed.request ?? null,
      updatedAt: sent[sent.length - 1].sentAt,
    })
    messages.push(...sent)
  }
  const reports: StoredConversationReport[] = [
    {
      id: 'conversation-report-abessolo-bekale',
      conversationId: 'conversation-abessolo',
      reporterId: BEKALE,
      reason: 'scam',
      comment: 'Asks for money by mobile money and promises 30% a month.',
      at: '2026-11-03T18:35:00Z',
      ...OPEN_REPORT,
    },
  ]
  return { conversations, messages, reports }
}
