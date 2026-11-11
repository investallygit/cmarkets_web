import { describe, expect, it } from 'vitest'
import type { ClickAnomalyDto } from '@/shared/api/contracts'
import { anomalyItems, anomalySignal, anomalyToHandle } from './anomalies'

const anomaly = (patch: Partial<ClickAnomalyDto>): ClickAnomalyDto => ({
  id: 'a1',
  sourceId: 's1',
  month: '2026-10',
  day: '2026-10-30',
  signal: 'sharedAddress',
  ratio: null,
  accounts: 38,
  address: '102.244.37.18',
  clicks: 210,
  itemCount: 6,
  items: Array.from({ length: 6 }, (_, index) => ({
    newsId: `n${index}`,
    type: 'flash' as const,
    headline: `Flash ${index}`,
  })),
  decision: 'open',
  reason: null,
  decidedBy: null,
  decidedAt: null,
  ...patch,
})

describe('click anomalies', () => {
  it('words the signal with its ratio or its accounts', () => {
    expect(anomalySignal(anomaly({}))).toEqual({
      key: 'mediaPayments.anomalies.signals.sharedAddress',
      values: { count: 38 },
    })
    expect(anomalySignal(anomaly({ signal: 'spike', ratio: 7 })).values).toEqual({ ratio: '7' })
    expect(anomalySignal(anomaly({ signal: 'spike', ratio: 7.14 })).values).toEqual({
      ratio: '7.1',
    })
  })

  it('names one item, the items of one type, or several', () => {
    expect(anomalyItems(anomaly({}))).toEqual({
      key: 'mediaPayments.anomalies.items.flash',
      count: 6,
    })
    const one = anomaly({
      itemCount: 1,
      items: [{ newsId: 'n1', type: 'article', headline: 'Douala: BVMAC launches a new segment' }],
    })
    expect(anomalyItems(one)).toEqual({ headline: 'Douala: BVMAC launches a new segment' })
    const mixed = anomaly({
      itemCount: 2,
      items: [
        { newsId: 'n1', type: 'article', headline: 'A' },
        { newsId: 'n2', type: 'flash', headline: 'B' },
      ],
    })
    expect(anomalyItems(mixed)).toEqual({ key: 'mediaPayments.anomalies.items.several' })
  })

  it('acts on the anomaly picked, else on the first open one, else on the first', () => {
    const decided = anomaly({ id: 'a0', decision: 'invalidated' })
    const open = anomaly({ id: 'a1' })
    expect(anomalyToHandle([decided, open], null)?.id).toBe('a1')
    expect(anomalyToHandle([decided, open], 'a0')?.id).toBe('a0')
    expect(anomalyToHandle([decided], null)?.id).toBe('a0')
    expect(anomalyToHandle([], null)).toBeNull()
  })
})
