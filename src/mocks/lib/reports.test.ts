import { describe, expect, it } from 'vitest'
import {
  closeReports,
  isReferred,
  OPEN_REPORT,
  reportedMember,
  reportsByAccount,
  type ReportState,
} from './reports'

// The reports of the directory and the messaging, spec section 15: "beyond 3 reports, the account
// is referred to the Admin".
describe('reports', () => {
  it('refers an account beyond the threshold of open reports', () => {
    expect(isReferred(3, 3)).toBe(false)
    expect(isReferred(4, 3)).toBe(true)
    expect(isReferred(1, 0)).toBe(true)
  })

  it('finds whom a conversation is reported about: the other member, or nobody in a group', () => {
    const members = [{ userId: 'user-trader' }, { userId: 'user-abessolo' }]
    expect(reportedMember({ kind: 'direct', members }, 'user-trader')).toBe('user-abessolo')
    expect(reportedMember({ kind: 'group', members }, 'user-trader')).toBeNull()
  })

  it('counts the reports about each account, and those still open', () => {
    const counts = reportsByAccount([
      { accountId: 'user-abessolo', status: 'open' },
      { accountId: 'user-abessolo', status: 'open' },
      { accountId: 'user-abessolo', status: 'closed' },
      { accountId: 'user-ondo', status: 'closed' },
      { accountId: null, status: 'open' },
    ])
    expect(Object.fromEntries(counts)).toEqual({
      'user-abessolo': { total: 3, open: 2 },
      'user-ondo': { total: 1, open: 0 },
    })
  })

  it('closes the open reports only, with the outcome and the Admin', () => {
    const reports: ReportState[] = [
      { ...OPEN_REPORT },
      { ...OPEN_REPORT },
      {
        status: 'closed',
        closedAt: '2026-10-01T08:00:00Z',
        closedBy: 'L. Mvogo',
        outcome: 'dismissed',
      },
    ]
    expect(closeReports(reports, 'suspended', 'L. Mvogo', '2026-11-06T10:00:00Z')).toBe(2)
    expect(reports.map((report) => report.outcome)).toEqual(['suspended', 'suspended', 'dismissed'])
    expect(reports[0]).toMatchObject({ status: 'closed', closedAt: '2026-11-06T10:00:00Z' })
  })
})
