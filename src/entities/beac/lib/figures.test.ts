import { describe, expect, it } from 'vitest'
import { aggregateUnit, decisionKind, formatBp, periodLabel, rateMoveTone } from './figures'

const rates = { policy: 4.5, marginalLending: 6, deposit: 0 }

describe('BEAC figures', () => {
  it('tells a meeting announced, unchanged, a cut or a hike in basis points', () => {
    expect(decisionKind({ rates: null, changeBp: null })).toEqual({ kind: 'announced' })
    expect(decisionKind({ rates, changeBp: null })).toEqual({ kind: 'first' })
    expect(decisionKind({ rates, changeBp: 0 })).toEqual({ kind: 'unchanged' })
    expect(decisionKind({ rates, changeBp: -25 })).toEqual({ kind: 'move', bp: -25 })
  })

  it('colours a cut green and a hike red, and writes the change with its sign', () => {
    expect([rateMoveTone(-25), rateMoveTone(10), rateMoveTone(0), rateMoveTone(null)]).toEqual([
      'up',
      'down',
      'neutral',
      'neutral',
    ])
    expect([
      formatBp(3, 'bp'),
      formatBp(-25, 'bp'),
      formatBp(0, 'pb'),
      formatBp(null, 'bp'),
    ]).toEqual(['+3 bp', '−25 bp', '0 pb', ''])
  })

  it('reads an aggregate as a growth, a ratio or months, dated by its month or year', () => {
    expect(
      ['m2', 'fx_reserves', 'external_coverage'].map((code) => aggregateUnit(code as never)),
    ).toEqual(['growth', 'months', 'percent'])
    expect([periodLabel('2026-08-01', false), periodLabel('2026-01-01', true)]).toEqual([
      '08/2026',
      '2026',
    ])
  })
})
