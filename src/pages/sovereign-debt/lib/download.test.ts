import { describe, expect, it } from 'vitest'
import { securitiesRows } from './download'

describe('securitiesRows', () => {
  it('writes a row a security under the header, the amounts in XAF', () => {
    const rows = securitiesRows({
      country: 'CMR',
      asOf: '2026-11-12',
      items: [
        {
          securityId: 'BTA-CM-13W-20261105',
          code: 'BTA CMR 13 wk 02/2027',
          country: 'CMR',
          instrument: 'bta',
          issueDate: '2026-11-05',
          maturityDate: '2027-02-04',
          outstanding: 25_000_000_000,
          ratePct: 4.7,
          yieldPct: null,
          yearsLeft: 0.23,
        },
      ],
    })
    expect(rows).toHaveLength(2)
    expect(rows[0][2]).toBe('security')
    expect(rows[1]).toEqual([
      '2026-11-12',
      'CMR',
      'BTA CMR 13 wk 02/2027',
      'BTA',
      '2026-11-05',
      '2027-02-04',
      25_000_000_000,
      4.7,
      null,
      0.23,
    ])
  })
})
