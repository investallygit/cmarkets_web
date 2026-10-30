import { describe, expect, it } from 'vitest'
import { crossesThreshold, exceedsVolume, quoteAlertMessage, severityOf } from './alerts'

const quote = (last: number, changePct = 0, volume = 0) => ({ last, changePct, volume })

describe('mock alert evaluation', () => {
  it('goes off when the price crosses the threshold in the alert direction', () => {
    const above = {
      type: 'price',
      securityId: 'SEMC',
      metric: 'price',
      direction: 'above',
      threshold: 52_700,
    } as const
    expect(crossesThreshold(above, quote(52_600), quote(52_700))).toBe(true)
    expect(crossesThreshold(above, quote(52_700), quote(52_800))).toBe(false)
    expect(crossesThreshold(above, quote(52_800), quote(52_600))).toBe(false)

    const fall = { ...above, metric: 'changePct', direction: 'below', threshold: -2 } as const
    expect(crossesThreshold(fall, quote(0, -1.9), quote(0, -2.1))).toBe(true)
    expect(crossesThreshold(fall, quote(0, -2.1), quote(0, -2.3))).toBe(false)
  })

  it('goes off once the volume passes the multiple of the average', () => {
    const volume = { type: 'volume', securityId: 'REGIONALE', multiple: 3 } as const
    expect(exceedsVolume(volume, quote(0, 0, 299), quote(0, 0, 305), 100)).toBe(true)
    expect(exceedsVolume(volume, quote(0, 0, 305), quote(0, 0, 310), 100)).toBe(false)
  })

  it('words the message as the mockup and colours it by severity', () => {
    const condition = {
      type: 'price',
      securityId: 'BANGE',
      metric: 'price',
      direction: 'above',
      threshold: 26_500,
    } as const
    expect(quoteAlertMessage(condition, { type: 'equity', currency: 'XAF' })).toBe(
      'Price above XAF 26,500',
    )
    expect(
      quoteAlertMessage({ ...condition, threshold: 101.5 }, { type: 'bond', currency: 'XAF' }),
    ).toBe('Price above 101.50')
    expect(
      quoteAlertMessage(
        { ...condition, metric: 'changePct', direction: 'below', threshold: -2 },
        { type: 'equity', currency: 'XAF' },
      ),
    ).toBe('Change below -2.00% on the session')
    expect(severityOf(condition)).toBe('warning')
    expect(severityOf({ type: 'portfolio', portfolioId: null })).toBe('critical')
    expect(severityOf({ type: 'auction', country: 'CM' })).toBe('info')
  })
})
