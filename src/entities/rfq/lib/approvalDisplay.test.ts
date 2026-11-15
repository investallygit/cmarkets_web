import { describe, expect, it } from 'vitest'
import type { ClientCheckDto } from '@/shared/api/contracts'
import { checkResult, limitLeft, REJECTION_REASONS, timeLeft } from './approvalDisplay'

const client = (change: Partial<ClientCheckDto> = {}): ClientCheckDto => ({
  client: { id: 'ngoma', name: 'B. Ngoma', organization: 'Pension fund G' },
  side: 'sell',
  linkConfirmed: true,
  linkedSince: '2026-10-03T09:05:00Z',
  dailyLimit: 1_000_000_000,
  usedToday: 450_000_000,
  tradesToday: 2,
  overLimit: false,
  ...change,
})

describe('approvalDisplay', () => {
  it('flags a link no longer confirmed before a limit exceeded, as screen 27 lists them', () => {
    expect(checkResult([client()])).toBe('ok')
    expect(checkResult([client({ overLimit: true })])).toBe('limit')
    expect(checkResult([client({ overLimit: true }), client({ linkConfirmed: false })])).toBe(
      'link',
    )
  })

  it("tells what is left of the client's daily limit, none without a limit", () => {
    // "1 bn · used 450 M · 550 M left".
    expect(limitLeft(client())).toBe(550_000_000)
    expect(limitLeft(client({ dailyLimit: null }))).toBeNull()
  })

  it('counts the time left to the deadline, nothing once past', () => {
    const now = Date.parse('2026-10-29T09:50:00Z')
    expect(timeLeft('2026-10-29T10:42:10Z', now)).toBe((52 * 60 + 10) * 1000)
    expect(timeLeft('2026-10-29T09:00:00Z', now)).toBe(0)
  })

  it("offers the spec's six reasons, other last", () => {
    expect(REJECTION_REASONS).toHaveLength(6)
    expect(REJECTION_REASONS.at(-1)).toBe('other')
  })
})
