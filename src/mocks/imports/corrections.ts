import type { PriceCorrectionRequestDto, StoredPriceDto } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { currentAccount, recordAudit, securities } from '../db'
import { priceHistory } from '../lib/bars'
import { newId } from '../lib/ids'
import { emit } from './cycle'
import { currentOverlay, resetOverlay } from './published'
import { correctionStore, type StoredCorrection } from './store'

/**
 * Manual corrections (CORR): a security's stored prices and where each came from, and a
 * correction, logged with what it replaced.
 */

/** GET /data/securities/{id}/prices: the stored sessions, newest first, and where each came from. */
export function storedPrices(securityId: string, from: string, to: string): StoredPriceDto[] {
  const security = securities.get(securityId)
  if (!security) return []
  const today = toMarketDay(Date.now())
  const entries = currentOverlay().prices.get(securityId)
  return priceHistory(security, from, to, '1d')
    .map((bar) => {
      const date = toMarketDay(bar.time)
      const entry = entries?.get(date)
      return { bar, date, entry }
    })
    .filter(({ date, entry }) => date < today || entry !== undefined)
    .map(({ bar, date, entry }) => ({
      date,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
      source: entry?.source ?? 'backfill',
      importId: entry?.importId ?? null,
      correctedAt: entry?.correctedAt ?? null,
    }))
    .reverse()
}

/** PUT /data/securities/{id}/prices/{date}: logged with what it replaced. */
export function correctPrice(
  securityId: string,
  date: string,
  request: PriceCorrectionRequestDto,
): StoredCorrection {
  const account = currentAccount()
  const security = securities.get(securityId)
  const bar = security ? priceHistory(security, date, date, '1d')[0] : undefined
  const { reason, ...after } = request
  const correction: StoredCorrection = {
    id: newId('correction'),
    securityId,
    date,
    before: bar
      ? { open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume }
      : after,
    after,
    reason,
    correctedAt: new Date().toISOString(),
    correctedBy: account.displayName,
    correctedById: account.id,
  }
  correctionStore.write([correction, ...correctionStore.read()])
  const fields = ['open', 'high', 'low', 'close', 'volume'] as const
  recordAudit(
    'price-correct',
    {
      type: 'price',
      id: `${securityId}:${date}`,
      label: `${security?.code ?? securityId} ${date}`,
    },
    {
      changes: fields
        .filter((field) => correction.before[field] !== after[field])
        .map((field) => ({
          field,
          scope: null,
          before: correction.before[field],
          after: after[field],
        })),
      reason,
      at: correction.correctedAt,
    },
  )
  resetOverlay()
  if (security && date === toMarketDay(Date.now())) {
    Object.assign(security, {
      open: after.open,
      high: after.high,
      low: after.low,
      last: after.close,
      volume: after.volume,
      updatedAt: correction.correctedAt,
    })
  }
  emit({ name: 'DataPublished', payload: { importId: correction.id, type: 'correction', date } })
  return correction
}
