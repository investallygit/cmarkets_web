import type { SharedSecurityDto } from '@/shared/api/contracts'
import type { StoredConversation, StoredMember, StoredMessage } from '../lib/messaging'
import { DEMO_USERS } from './users'

/**
 * The conversations of the screen 11 mockup, as P. Owona sees them: K. Atangana's thread with
 * its bond, the rates desk of the traders, M. Ndong, S. Mvondo's request, R. Tamba, E. Fouda;
 * and those of K. Atangana, whose session the end-to-end tests use.
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

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

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

/** The conversations and their messages, the times of today counted back from `now`. */
export function createConversations(
  now: number,
  bond: (securityId: string, at: string) => SharedSecurityDto | null,
): { conversations: StoredConversation[]; messages: StoredMessage[] } {
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
  return { conversations, messages }
}
