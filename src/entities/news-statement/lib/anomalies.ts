import type { ClickAnomalyDto } from '@/shared/api/contracts'

/** An anomaly's signal as the mockup words it: "Spike ×7 the average", "38 accounts · same IP address". */
export function anomalySignal(anomaly: ClickAnomalyDto): {
  key: `mediaPayments.anomalies.signals.${ClickAnomalyDto['signal']}`
  values: { ratio?: string; count?: number }
} {
  const key = `mediaPayments.anomalies.signals.${anomaly.signal}` as const
  if (anomaly.signal === 'spike') {
    const ratio = anomaly.ratio ?? 0
    return { key, values: { ratio: Number.isInteger(ratio) ? String(ratio) : ratio.toFixed(1) } }
  }
  return { key, values: { count: anomaly.accounts ?? 0 } }
}

/**
 * The items an anomaly concerns: one item's headline in quotes, "3 FLASH items" when all of one
 * type, "Several items" otherwise.
 */
export function anomalyItems(anomaly: ClickAnomalyDto):
  | { headline: string }
  | {
      key: 'mediaPayments.anomalies.items.flash' | 'mediaPayments.anomalies.items.article'
      count: number
    }
  | { key: 'mediaPayments.anomalies.items.several' } {
  const [first] = anomaly.items
  if (anomaly.itemCount === 1 && first) return { headline: first.headline }
  const types = new Set(anomaly.items.map((item) => item.type))
  if (types.size === 1 && anomaly.items.length === anomaly.itemCount) {
    return types.has('flash')
      ? { key: 'mediaPayments.anomalies.items.flash', count: anomaly.itemCount }
      : { key: 'mediaPayments.anomalies.items.article', count: anomaly.itemCount }
  }
  return { key: 'mediaPayments.anomalies.items.several' }
}

/**
 * The anomaly the actions apply to: the one picked, else the first still open, else the first (its
 * clicks can still be read).
 */
export function anomalyToHandle(
  anomalies: readonly ClickAnomalyDto[],
  pickedId: string | null,
): ClickAnomalyDto | null {
  return (
    anomalies.find((anomaly) => anomaly.id === pickedId) ??
    anomalies.find((anomaly) => anomaly.decision === 'open') ??
    anomalies[0] ??
    null
  )
}
