import i18next from 'i18next'
import { describe, expect, it } from 'vitest'
import type { YieldCurvePointDto } from '@/shared/api/contracts'

import { pointNote } from './pointNote'

const day = (iso: string) => iso.split('-').reverse().join('/')

const series = (agreements: number, referenceSecurity: string | null): YieldCurvePointDto => ({
  years: 3,
  yieldPct: 6.0234,
  source: 'series',
  asOf: '2026-11-02',
  stale: false,
  series: {
    code: 'CMR3Y.CMKT',
    pointType: agreements > 0 ? 'secondary' : 'model',
    referenceSecurity,
    source: agreements > 0 ? 'cmarket' : 'beac',
    agreements,
  },
})

describe("a curve point's tooltip line", () => {
  it('names an auction or a close, then the day', () => {
    const t = i18next.getFixedT('en')
    const auction: YieldCurvePointDto = {
      years: 0.5,
      yieldPct: 5.0819,
      source: 'auction',
      asOf: '2026-10-30',
      stale: false,
      series: null,
    }
    expect(pointNote(t, auction, day)).toBe('Auction · 30/10/2026')
    expect(pointNote(t, { ...auction, source: 'quote' }, day)).toBe('BVMAC close · 30/10/2026')
  })

  it("gives a file's point its type and source", () => {
    expect(pointNote(i18next.getFixedT('en'), series(0, null), day)).toBe(
      'Model · BEAC · 02/11/2026',
    )
  })

  it('names the RFQ agreements that gave a point in place of its source (step 49)', () => {
    const en = i18next.getFixedT('en')
    const fr = i18next.getFixedT('fr')
    expect(pointNote(en, series(1, 'CMOTA2610283'), day)).toBe(
      'Secondary market · RFQ agreement · CMOTA2610283 · 02/11/2026',
    )
    expect(pointNote(en, series(3, null), day)).toBe(
      'Secondary market · 3 RFQ agreements · 02/11/2026',
    )
    expect(pointNote(fr, series(1, 'CMOTA2610283'), day)).toBe(
      'Marché secondaire · Accord RFQ · CMOTA2610283 · 02/11/2026',
    )
    expect(pointNote(fr, series(2, null), day)).toBe(
      'Marché secondaire · 2 accords RFQ · 02/11/2026',
    )
  })
})
