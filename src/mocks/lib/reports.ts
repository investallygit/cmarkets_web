/**
 * The reports of the directory and the messaging (spec section 15) as the Admin deals with them:
 * open until dismissed, or until the account they are about is suspended; beyond the Admin's
 * threshold of open reports, an account is referred to the Admin.
 */

/** What a closed report of a profile or a conversation became. */
export type ReportOutcome = 'dismissed' | 'suspended'

/** How the Admin dealt with a report, as the reports of publications record it. */
export interface ReportState {
  status: 'open' | 'closed'
  closedAt: string | null
  /** The Admin's display name. */
  closedBy: string | null
  outcome: ReportOutcome | null
}

export const OPEN_REPORT: ReportState = {
  status: 'open',
  closedAt: null,
  closedBy: null,
  outcome: null,
}

/** Beyond the threshold: four open reports for a threshold of three. */
export const isReferred = (openReports: number, threshold: number) => openReports > threshold

/** The other member of a direct conversation, whom its reports are about; none for a group. */
export function reportedMember(
  conversation: { kind: 'direct' | 'group'; members: readonly { userId: string }[] },
  reporterId: string,
): string | null {
  if (conversation.kind !== 'direct') return null
  return conversation.members.find((member) => member.userId !== reporterId)?.userId ?? null
}

/** A report and the account it is about, whatever it reports: a profile, a message, a note. */
export interface AccountReport {
  accountId: string | null
  status: ReportState['status']
}

/** The reports about each account: in all, and still open. */
export function reportsByAccount(
  reports: readonly AccountReport[],
): Map<string, { total: number; open: number }> {
  const counts = new Map<string, { total: number; open: number }>()
  for (const { accountId, status } of reports) {
    if (!accountId) continue
    const count = counts.get(accountId) ?? { total: 0, open: 0 }
    count.total += 1
    if (status === 'open') count.open += 1
    counts.set(accountId, count)
  }
  return counts
}

/** Closes the open reports given; returns how many it closed. */
export function closeReports(
  reports: readonly ReportState[],
  outcome: ReportOutcome,
  by: string,
  at: string,
): number {
  const open = reports.filter((report) => report.status === 'open')
  for (const report of open) {
    Object.assign(report, { status: 'closed', closedAt: at, closedBy: by, outcome })
  }
  return open.length
}
