import type {
  AuctionDto,
  DividendDto,
  ImportType,
  ImportValues,
  StoredPriceDto,
} from '@/shared/api/contracts'
import { addDays } from '@/shared/lib/isoDate'
import { auctions as auctionFixtures, securities, setStoredIndexCloses } from '../db'
import { CURVE_MATURITIES, type CurveFile } from '../fixtures/curves'
import { priceHistory, setStoredSessions, type StoredSession } from '../lib/bars'
import { auctionSecurity, auctionSecurityLabel, curveYears } from '../lib/dataImport'
import { findSecurity } from './lookups'
import {
  correctionStore,
  importStore,
  isSeeding,
  type StoredCorrection,
  type StoredImport,
  type StoredImportRow,
} from './store'

/**
 * What the published files put in the database: prices and index closes in place of the
 * generated ones, auctions, curve points and dividends. Built again from the uploads and the
 * corrections when either changes.
 */

interface PriceEntry {
  /** Absent for a seeded file: the generated session stands. */
  values?: StoredSession
  source: StoredPriceDto['source']
  importId: string | null
  correctedAt: string | null
}

interface Overlay {
  prices: Map<string, Map<string, PriceEntry>>
  sessions: Map<string, Map<string, StoredSession>>
  indices: Map<string, Map<string, number>>
  /** Index closes published by a file, seeded or not. */
  indexFiles: Map<string, Set<string>>
}

const EMPTY_OVERLAY: Overlay = {
  prices: new Map(),
  sessions: new Map(),
  indices: new Map(),
  indexFiles: new Map(),
}
let overlay: Overlay | null = null

function nested<V>(map: Map<string, Map<string, V>>, key: string): Map<string, V> {
  let inner = map.get(key)
  if (!inner) {
    inner = new Map()
    map.set(key, inner)
  }
  return inner
}

/** Rows that change the database: a seeded file only repeats the generated data, unless fixed. */
const effective = (stored: StoredImport, row: StoredImportRow) => !stored.seed || row.edited

function buildOverlay(imports: readonly StoredImport[], corrections: readonly StoredCorrection[]) {
  const built: Overlay = {
    prices: new Map(),
    sessions: new Map(),
    indices: new Map(),
    indexFiles: new Map(),
  }
  const events = [
    ...imports
      .filter((stored) => stored.status === 'published' && stored.publishedAt)
      .map((stored) => ({ at: stored.publishedAt ?? '', stored, correction: undefined })),
    ...corrections.map((correction) => ({
      at: correction.correctedAt,
      stored: undefined,
      correction,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at))
  for (const { stored, correction } of events) {
    if (correction) {
      const { open, high, low, close, volume } = correction.after
      nested(built.prices, correction.securityId).set(correction.date, {
        values: { open, high, low, close, volume },
        source: 'correction',
        importId: null,
        correctedAt: correction.correctedAt,
      })
      continue
    }
    if (!stored) continue
    for (const row of stored.rows) {
      const values = row.values
      if (stored.type === 'daily-prices' || stored.type === 'history') {
        const security = findSecurity(String(values.code))
        if (!security) continue
        const session = effective(stored, row)
          ? {
              open: Number(values.open),
              high: Number(values.high),
              low: Number(values.low),
              close: Number(values.close),
              volume: Number(values.volume),
            }
          : undefined
        nested(built.prices, security.id).set(String(values.date), {
          values: session,
          source: 'file',
          importId: stored.id,
          correctedAt: null,
        })
      } else if (stored.type === 'indices') {
        const code = String(values.index)
        const days = built.indexFiles.get(code) ?? new Set<string>()
        built.indexFiles.set(code, days.add(String(values.date)))
        if (effective(stored, row)) {
          nested(built.indices, code).set(String(values.date), Number(values.value))
        }
      }
    }
  }
  for (const [securityId, days] of built.prices) {
    for (const [day, entry] of days) {
      if (entry.values) nested(built.sessions, securityId).set(day, entry.values)
    }
  }
  return built
}

export function currentOverlay(): Overlay {
  if (isSeeding()) return EMPTY_OVERLAY
  overlay ??= buildOverlay(importStore.read(), correctionStore.read())
  return overlay
}

setStoredSessions((securityId) => currentOverlay().sessions.get(securityId))
setStoredIndexCloses((code) => currentOverlay().indices.get(code))

export const publishedRows = (type: ImportType) =>
  (isSeeding() ? [] : importStore.read())
    .filter((stored) => stored.type === type && stored.status === 'published')
    .sort((a, b) => (a.publishedAt ?? '').localeCompare(b.publishedAt ?? ''))
    .flatMap((stored) => stored.rows.filter((row) => effective(stored, row)))

function auctionOf(values: ImportValues, id: string): AuctionDto | undefined {
  const security = auctionSecurity(String(values.security))
  if (!security) return undefined
  const date = String(values.date)
  const { instrument, term } = security
  const maturityDate =
    typeof values.maturity === 'string'
      ? values.maturity
      : instrument === 'BTA'
        ? addDays(date, term * 7)
        : `${Number(date.slice(0, 4)) + term}${date.slice(4)}`
  const amountOffered = Number(values.offered)
  const amountBid = Number(values.bids)
  return {
    id,
    date,
    country: String(values.country),
    instrument,
    term,
    maturityDate,
    amountOffered,
    amountBid,
    amountAllotted: Number(values.allotted),
    coverRatio: Number((amountBid / amountOffered).toFixed(2)),
    averageRate: Number(values.avg_rate),
    marginalRate: Number(values.marginal_rate),
  }
}

export const auctionKey = (auction: Pick<AuctionDto, 'date' | 'country' | 'instrument' | 'term'>) =>
  `${auction.date}|${auction.country}|${auctionSecurityLabel(auction.instrument, auction.term)}`

/** The BEAC auctions: the sample results, and those of the files published since. */
export function currentAuctions(): AuctionDto[] {
  const byKey = new Map(auctionFixtures.map((auction) => [auctionKey(auction), auction]))
  publishedRows('auctions').forEach((row) => {
    const auction = auctionOf(row.values, `auction-file-${row.id}`)
    if (auction) byKey.set(auctionKey(auction), auction)
  })
  return [...byKey.values()].sort((a, b) => b.date.localeCompare(a.date))
}

/** The latest curves file published on or before a date for a country. */
export function publishedCurve(country: string, date: string): CurveFile | undefined {
  const rows = publishedRows('curves').filter(
    (row) => row.values.country === country && String(row.values.date) <= date,
  )
  const latest = rows
    .map((row) => String(row.values.date))
    .sort()
    .at(-1)
  if (!latest) return undefined
  const rates = CURVE_MATURITIES.map((years) => {
    const row = rows.findLast(
      (candidate) =>
        candidate.values.date === latest && curveYears(String(candidate.values.maturity)) === years,
    )
    return row ? Number(row.values.rate) : undefined
  })
  return { date: latest, rates }
}

/** Dividends of the corporate actions files, newest first. */
export function publishedDividends(securityId: string): Omit<DividendDto, 'currency'>[] {
  const security = securities.get(securityId)
  if (!security) return []
  return publishedRows('corporate-actions')
    .filter(
      (row) =>
        row.values.type === 'dividend' && findSecurity(String(row.values.code))?.id === securityId,
    )
    .map((row) => {
      const exDate = String(row.values.ex_date)
      const paymentDate = String(row.values.pay_date)
      const amount = Number(row.values.amount)
      const before = priceHistory(security, addDays(exDate, -10), addDays(exDate, -1), '1d').at(-1)
      return {
        fiscalYear: Number(paymentDate.slice(0, 4)),
        kind: 'final' as const,
        amount,
        exDate,
        paymentDate,
        yieldPct: before ? Number(((amount / before.close) * 100).toFixed(1)) : 0,
      }
    })
    .sort((a, b) => b.exDate.localeCompare(a.exDate))
}

export function saveImports(imports: StoredImport[]): void {
  importStore.write(imports)
  overlay = null
}

/** A price corrected: what the database holds is built again on the next read. */
export function resetOverlay(): void {
  overlay = null
}
