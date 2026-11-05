import type {
  AdminConversationDto,
  AdminReportDto,
  AdminUserDetailsDto,
  ReportedAccountDto,
  ReportedItemDto,
  ReportedItemType,
} from '@/shared/api/contracts'
import {
  analystStore,
  anyAccount,
  contentReportStore,
  conversationReportStore,
  conversationStore,
  directorySettingsStore,
  isClientAccount,
  listStatus,
  messageDto,
  messagesOf,
  profileReportStore,
  publicationStore,
  type StoredConversationReport,
  type StoredProfileReport,
} from './db'
import type { StoredAccount } from './fixtures/accounts'
import { activeMembers, type StoredConversation } from './lib/messaging'
import {
  closeReports,
  isReferred,
  reportedMember,
  reportsByAccount,
  type AccountReport,
  type ReportOutcome,
} from './lib/reports'

/**
 * The reports of the directory and the messaging as the Admin reads them in MOD (spec section
 * 15): what each one is about, the accounts referred beyond the threshold, the conversations
 * reported, which alone the Admin may read.
 */

const conversationsById = () =>
  new Map(conversationStore.read().map((conversation) => [conversation.id, conversation]))

/** The member a report of a conversation is about: the other one of a direct conversation. */
function aboutOf(
  report: StoredConversationReport,
  conversations: Map<string, StoredConversation>,
): string | null {
  const conversation = conversations.get(report.conversationId)
  return conversation ? reportedMember(conversation, report.reporterId) : null
}

/** Every report about an account: of its profile, its direct conversations and its notes. */
function accountReports(): AccountReport[] {
  const conversations = conversationsById()
  const authors = new Map(analystStore.read().map((analyst) => [analyst.id, analyst.userId]))
  const authorOf = new Map(
    publicationStore
      .read()
      .map((publication) => [publication.id, authors.get(publication.analystId) ?? null]),
  )
  return [
    ...profileReportStore.read().map((report) => ({
      accountId: report.userId,
      status: report.status,
    })),
    ...conversationReportStore.read().map((report) => ({
      accountId: aboutOf(report, conversations),
      status: report.status,
    })),
    ...contentReportStore.read().map((report) => ({
      accountId: authorOf.get(report.publicationId) ?? null,
      status: report.status,
    })),
  ]
}

const threshold = () => directorySettingsStore.read().reportThreshold

/** USER: the reports about a client, and whether the account is referred to the Admin. */
export function reportsReceived(account: StoredAccount): AdminUserDetailsDto['reportsReceived'] {
  if (!isClientAccount(account)) return null
  const count = reportsByAccount(accountReports()).get(account.id) ?? { total: 0, open: 0 }
  return { ...count, referred: isReferred(count.open, threshold()) }
}

function reportedAccount(
  userId: string,
  counts: Map<string, { open: number }>,
): ReportedAccountDto | null {
  const account = anyAccount(userId)
  if (!account) return null
  const openReports = counts.get(userId)?.open ?? 0
  return {
    userId,
    displayName: account.displayName,
    accountType: account.accountType,
    status: listStatus(account),
    openReports,
    referred: isReferred(openReports, threshold()),
  }
}

function reportDto(report: StoredProfileReport | StoredConversationReport): AdminReportDto {
  const reporter = anyAccount(report.reporterId)
  return {
    id: report.id,
    reason: report.reason,
    comment: report.comment,
    reportedAt: report.at,
    reportedBy: {
      userId: report.reporterId,
      displayName: reporter?.displayName ?? report.reporterId,
      accountType: reporter?.accountType ?? 'student',
    },
  }
}

/** The open reports by what they are about, the newest first. */
function grouped<T extends { at: string; status: string }>(
  reports: readonly T[],
  keyOf: (report: T) => string,
): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const report of reports.filter((candidate) => candidate.status === 'open')) {
    groups.set(keyOf(report), [...(groups.get(keyOf(report)) ?? []), report])
  }
  groups.forEach((group) => group.sort((a, b) => b.at.localeCompare(a.at)))
  return groups
}

/** A group's name, or the two members of a direct conversation. */
function conversationTitle(conversation: StoredConversation): string {
  if (conversation.title) return conversation.title
  return conversation.members
    .map((member) => anyAccount(member.userId)?.displayName ?? member.userId)
    .join(' · ')
}

/**
 * MOD: the profiles and the conversations with open reports, the accounts referred first, then
 * the newest report first.
 */
export function reportedItems(type: ReportedItemType | null): ReportedItemDto[] {
  const counts = reportsByAccount(accountReports())
  const items: ReportedItemDto[] = []
  if (type !== 'conversation') {
    for (const [userId, reports] of grouped(profileReportStore.read(), (report) => report.userId)) {
      const account = reportedAccount(userId, counts)
      if (!account) continue
      items.push({
        type: 'profile',
        id: userId,
        title: account.displayName,
        account,
        conversation: null,
        since: reports[0].at,
        reports: reports.map(reportDto),
      })
    }
  }
  if (type !== 'profile') {
    const conversations = conversationsById()
    const byConversation = grouped(
      conversationReportStore.read(),
      (report) => report.conversationId,
    )
    for (const [conversationId, reports] of byConversation) {
      const conversation = conversations.get(conversationId)
      if (!conversation) continue
      const aboutId = aboutOf(reports[0], conversations)
      items.push({
        type: 'conversation',
        id: conversationId,
        title: conversationTitle(conversation),
        account: aboutId ? reportedAccount(aboutId, counts) : null,
        conversation: { kind: conversation.kind, memberCount: activeMembers(conversation).length },
        since: reports[0].at,
        reports: reports.map(reportDto),
      })
    }
  }
  return items.sort(
    (a, b) =>
      Number(b.account?.referred ?? false) - Number(a.account?.referred ?? false) ||
      b.since.localeCompare(a.since),
  )
}

/** The Admin reads a conversation once it was reported, whatever became of the report. */
export function reportedConversation(conversationId: string): StoredConversation | undefined {
  const reported = conversationReportStore
    .read()
    .some((report) => report.conversationId === conversationId)
  return reported ? conversationsById().get(conversationId) : undefined
}

/** A reported conversation as its members read it, its members gone included. */
export function adminConversationDto(
  conversation: StoredConversation,
  adminId: string,
): AdminConversationDto {
  return {
    id: conversation.id,
    kind: conversation.kind,
    title: conversationTitle(conversation),
    createdAt: conversation.createdAt,
    members: conversation.members.map((member) => {
      const account = anyAccount(member.userId)
      return {
        userId: member.userId,
        displayName: account?.displayName ?? member.userId,
        accountType: account?.accountType ?? 'student',
        left: member.leftAt !== null,
      }
    }),
    messages: messagesOf(conversation.id)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
      .map((message) => messageDto(message, conversation, adminId)),
  }
}

/** Dismisses the open reports of a profile or a conversation: how many it closed. */
export function dismissReports(type: ReportedItemType, id: string, by: string): number {
  const at = new Date().toISOString()
  if (type === 'profile') {
    const reports = profileReportStore.read()
    const closed = closeReports(
      reports.filter((report) => report.userId === id),
      'dismissed',
      by,
      at,
    )
    if (closed > 0) profileReportStore.write(reports)
    return closed
  }
  const reports = conversationReportStore.read()
  const closed = closeReports(
    reports.filter((report) => report.conversationId === id),
    'dismissed',
    by,
    at,
  )
  if (closed > 0) conversationReportStore.write(reports)
  return closed
}

/**
 * The account suspended: the open reports of its profile and its direct conversations are dealt
 * with. The reports of its notes stay with the moderation of each one.
 */
export function closeReportsAbout(userId: string, outcome: ReportOutcome, by: string): number {
  const at = new Date().toISOString()
  const profileReports = profileReportStore.read()
  const onProfile = closeReports(
    profileReports.filter((report) => report.userId === userId),
    outcome,
    by,
    at,
  )
  if (onProfile > 0) profileReportStore.write(profileReports)
  const conversations = conversationsById()
  const conversationReports = conversationReportStore.read()
  const inConversations = closeReports(
    conversationReports.filter((report) => aboutOf(report, conversations) === userId),
    outcome,
    by,
    at,
  )
  if (inConversations > 0) conversationReportStore.write(conversationReports)
  return onProfile + inConversations
}
