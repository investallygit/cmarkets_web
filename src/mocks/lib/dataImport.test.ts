import { describe, expect, it } from 'vitest'
import type { ImportValues } from '@/shared/api/contracts'
import {
  canPublish,
  checkRows,
  countRows,
  importTypeOf,
  rowKey,
  rowStatus,
  type ImportContext,
} from './dataImport'

const SESSION = '2026-10-30'

/** A database with SEMC closing at 52,000 the session before, and its stored session. */
function context(overrides: Partial<ImportContext> = {}): ImportContext {
  return {
    sessionDate: SESSION,
    isSession: (day) => !['2026-10-31', '2026-11-01'].includes(day),
    isSecurity: (code) => ['SEMC', 'SIAT'].includes(code),
    isIndex: (code) => code === 'BVMAC-A',
    stored: (key) =>
      key === `SEMC|${SESSION}`
        ? { open: 51_900, high: 52_800, low: 51_900, close: 52_500, volume: 96 }
        : undefined,
    previous: () => 52_000,
    ...overrides,
  }
}

const prices = (cells: Record<string, string | number>[]) =>
  checkRows(
    importTypeOf('daily-prices'),
    cells.map((row, index) => ({ line: index + 2, cells: row })),
    context(),
  )

const row = (overrides: Record<string, string | number> = {}) => ({
  date: SESSION,
  code: 'SEMC',
  open: 51_900,
  high: 52_800,
  low: 51_900,
  close: 52_500,
  volume: 96,
  ...overrides,
})

describe('data import checks', () => {
  it('tell new, changed and unchanged rows from the database, and duplicates', () => {
    const [unchanged] = prices([row()])
    const [changed] = prices([row({ close: 52_600 })])
    const siat = row({ code: 'SIAT', open: 52_000, high: 52_100, low: 52_000, close: 52_000 })
    const [created, duplicate] = prices([siat, siat])
    expect(unchanged.diff).toBe('unchanged')
    expect(changed).toMatchObject({ diff: 'changed', stored: { close: 52_500 } })
    expect(created.diff).toBe('new')
    expect(duplicate.issues).toEqual([
      expect.objectContaining({ code: 'duplicate', severity: 'error', params: { line: 2 } }),
    ])
  })

  it('read French and English numbers and dates, and refuse what is not', () => {
    const [french, wrong] = prices([
      row({ date: '30/10/2026', close: '52 500', volume: '96' }),
      row({ date: '31/02/2026', close: 'abc', volume: '1.5' }),
    ])
    expect(french.values).toMatchObject({ date: SESSION, close: 52_500, volume: 96 })
    expect(french.issues).toEqual([])
    expect(wrong.issues.map((issue) => [issue.code, issue.column])).toEqual([
      ['notADate', 'date'],
      ['notANumber', 'close'],
      ['notANumber', 'volume'],
    ])
    expect(rowStatus(wrong)).toBe('error')
  })

  it('refuse unknown securities, days without a session and other sessions', () => {
    const [unknown, weekend, other] = prices([
      row({ code: 'XYZ' }),
      row({ date: '2026-10-31' }),
      row({ date: '2026-10-29' }),
    ])
    expect(unknown.issues[0]).toMatchObject({ code: 'unknownSecurity', params: { code: 'XYZ' } })
    expect(weekend.issues[0].code).toBe('notASession')
    expect(other.issues[0]).toMatchObject({
      code: 'otherSession',
      params: { date: '2026-10-29', session: SESSION },
    })
  })

  it('raise an alert above the change threshold and on a zero volume with a new close', () => {
    const [jump, quiet] = prices([
      row({ high: 60_000, close: 60_000 }),
      row({ code: 'SIAT', open: 52_000, high: 52_100, low: 52_000, close: 52_100, volume: 0 }),
    ])
    expect(jump.issues).toEqual([
      expect.objectContaining({
        code: 'changeAboveThreshold',
        severity: 'alert',
        message: 'Close +15.38% vs previous (threshold 15%)',
        params: expect.objectContaining({ change: 15.38, threshold: 15, previous: 52_000 }),
      }),
    ])
    expect(quiet.issues[0]).toMatchObject({ code: 'zeroVolumeChanged', severity: 'alert' })
    expect(rowStatus(jump)).toBe('alert')
  })

  it('check that the high and the low hold the open and the close', () => {
    const [wrong] = prices([row({ high: 52_000 })])
    expect(wrong.issues[0].code).toBe('inconsistentPrices')
  })

  it('compare an auction rate with the previous auction, in points', () => {
    const [gabon] = checkRows(
      importTypeOf('auctions'),
      [
        {
          line: 2,
          cells: {
            date: SESSION,
            country: 'Gabon',
            security: 'BTA 13 weeks',
            offered: 10_000,
            bids: 8_200,
            allotted: 8_200,
            avg_rate: 7.45,
            marginal_rate: 7.6,
          },
        },
      ],
      context({ previous: () => 6.05, stored: () => undefined }),
    )
    expect(gabon.values).toMatchObject({ country: 'GA', security: 'BTA 13 wk' })
    expect(gabon.issues[0].message).toBe('Rate +1.40 pt vs previous (threshold 1.00)')
    expect(rowKey('auctions', gabon.values)).toBe(`${SESSION}|GA|BTA 13 wk`)
  })

  it('count the rows, and publish once no error or unchecked alert remains', () => {
    const rows = prices([row(), row({ code: 'SIAT', close: 60_000, high: 60_000 })]).map(
      (checked) => ({ ...checked, checked: false }),
    )
    const counts = countRows(rows)
    expect(counts).toEqual({
      read: 2,
      new: 1,
      changed: 0,
      unchanged: 1,
      alerts: 1,
      alertsChecked: 0,
      errors: 0,
    })
    expect(canPublish(counts)).toBe(false)
    rows[1].checked = true
    expect(canPublish(countRows(rows))).toBe(true)
  })

  it('keep optional columns empty and require the others', () => {
    const [missing] = prices([{ date: SESSION, code: 'SEMC' } as Record<string, string>])
    expect(missing.issues.map((issue) => issue.column)).toEqual([
      'open',
      'high',
      'low',
      'close',
      'volume',
    ])
    const values: ImportValues = missing.values
    expect(values.value).toBeNull()
  })
})
