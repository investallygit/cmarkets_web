import { beforeAll, describe, expect, it, vi } from 'vitest'

// Saturday 31 October 2026, morning in Douala.
const NOW = Date.parse('2026-10-31T09:00:00Z')

type Db = typeof import('./db')
type Admin = typeof import('./admin')

describe('administration store', () => {
  let db: Db
  let admin: Admin

  beforeAll(async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] })
    db = await import('./db')
    admin = await import('./admin')
    db.setSessionUser('user-admin')
  })

  const stored = (id: string) => db.accountStore.read().some((account) => account.id === id)

  it('counts the active accounts of the screen 9 mockup, the suspended ones apart', () => {
    expect(admin.accountCounts()).toEqual({
      student: 1_284,
      analyst: 96,
      manager: 212,
      trader: 348,
      journalist: 37,
      ceo: 58,
      dataAdmin: 4,
      admin: 2,
    })
    const suspended = db.allAccounts().filter((account) => account.status === 'suspended')
    expect(suspended).toHaveLength(13)
    expect(suspended.map((account) => account.displayName)).toContain('F. Mba')
  })

  it('lists the status requests of the mockup, newest first, each with its type', () => {
    const pending = admin.analystRequests('pending')
    expect(pending.map((request) => [request.displayName, request.accountType])).toEqual([
      ['R. Essomba', 'analyst'],
      ['F. Biyong', 'analyst'],
      ['D. Moussavou', 'analyst'],
    ])
    expect(admin.analystRequests('rejected')).toHaveLength(3)
    // Journalists and CEOs are approved too (spec section 12, second version).
    const approved = admin.analystRequests('approved').map((request) => request.accountType)
    expect(new Set(approved)).toEqual(new Set(['analyst', 'journalist', 'ceo']))
  })

  it('puts the reported publications before those waiting, a first publication flagged', () => {
    const queue = admin.moderationQueue()
    expect(queue.map((item) => [item.kind, item.publicationId, item.firstPublication])).toEqual([
      ['reported', 'pub-gabon-oil', false],
      ['reported', 'pub-safacam-rubber', false],
      ['pending', 'pub-chad-budget', true],
      ['pending', 'pub-gabon-auctions', false],
    ])
    expect(queue[0].reports).toEqual([
      expect.objectContaining({ reason: 'misleading', reportedBy: 'L. Ella' }),
    ])
  })

  it('shows a moderator the whole draft waiting, as readers will read it', () => {
    const chad = db.publicationStore.read().find((candidate) => candidate.id === 'pub-chad-budget')
    const view = chad && admin.moderationView(chad)
    expect(view).toMatchObject({
      title: 'Chad: 2027 budget and financing needs',
      status: 'pending',
      hasAccess: true,
      analyst: { displayName: 'C. Nguema' },
      versions: [],
    })
    expect(view?.body?.content?.length).toBeGreaterThan(0)
  })

  it('owes September to the analysts but K. Atangana, paid on 5 October', () => {
    const september = admin.adminPayouts().filter((payout) => payout.month === '2026-09')
    expect(september.find((payout) => payout.analyst.id === 'analyst-atangana')).toMatchObject({
      status: 'paid',
      paidAt: '2026-10-05',
      paidBy: 'L. Mvogo',
    })
    const others = september.filter((payout) => payout.analyst.id !== 'analyst-atangana')
    expect(others.length).toBeGreaterThan(0)
    expect(others.every((payout) => payout.status === 'due' && payout.paidAt === null)).toBe(true)
    // October accrues.
    expect(
      admin
        .adminPayouts()
        .filter((payout) => payout.month === '2026-10')
        .every((payout) => payout.status === 'accruing'),
    ).toBe(true)
  })

  it('details an analyst: publications, sales and the closed report', () => {
    const account = db.anyAccount('user-analyst')
    if (!account) throw new Error('No demo analyst')
    const details = admin.adminUserDetails(account)
    expect(details.publishing).toMatchObject({ withdrawn: 1, reports: 1, openReports: 0 })
    expect(details.publishing?.publications).toBeGreaterThan(40)
    expect(details.subscription).toMatchObject({ planName: 'Professional', paidBy: 'user' })
    expect(details.twoFactor).toEqual({ channel: 'email', mandatory: false })
  })

  it('copies a generated account into the stored ones before changing it', () => {
    const generated = db.anyAccount('user-p0001')
    expect(generated).toBeDefined()
    expect(stored('user-p0001')).toBe(false)
    expect(db.editableAccount('user-p0001')).toEqual(generated)
    expect(stored('user-p0001')).toBe(true)
    expect(db.allAccounts().filter((account) => account.id === 'user-p0001')).toHaveLength(1)
  })
})
