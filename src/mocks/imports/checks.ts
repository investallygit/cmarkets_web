import type { ImportType, ImportValues } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { addDays } from '@/shared/lib/isoDate'
import { indexDailyCloses, indices, securities } from '../db'
import { CURVE_FILE, CURVE_MATURITIES } from '../fixtures/curves'
import { priceHistory, type StoredSession } from '../lib/bars'
import {
  auctionSecurity,
  checkRows,
  curveYears,
  importTypeOf,
  rowKey,
  STORED_COLUMNS,
  type CheckedRow,
  type ImportContext,
} from '../lib/dataImport'
import type { Cell } from '../lib/templateFile'
import { findSecurity, isSessionDay } from './lookups'
import {
  auctionKey,
  currentAuctions,
  currentOverlay,
  publishedCurve,
  publishedRows,
} from './published'
import type { StoredImportRow } from './store'

/** The checks of an upload against what the database holds (spec section 11). */

function storedPrice(securityId: string, day: string): StoredSession | undefined {
  const security = securities.get(securityId)
  if (!security) return undefined
  const bar = priceHistory(security, day, day, '1d')[0]
  // Today's session is stored once its file is published; before, it is only live.
  if (
    !bar ||
    (day === toMarketDay(Date.now()) && !currentOverlay().prices.get(securityId)?.has(day))
  ) {
    return undefined
  }
  const { open, high, low, close, volume } = bar
  return { open, high, low, close, volume }
}

function previousClose(securityId: string, day: string): number | undefined {
  const security = securities.get(securityId)
  if (!security) return undefined
  return priceHistory(security, addDays(day, -10), addDays(day, -1), '1d').at(-1)?.close
}

export function indexClose(code: string, day: string): number | undefined {
  return indexDailyCloses(code, day, day)?.[0]?.close
}

function previousIndexClose(code: string, day: string): number | undefined {
  return indexDailyCloses(code, addDays(day, -10), addDays(day, -1))?.at(-1)?.close
}

/** The stored values of a row's key, as the file would write them. */
function storedValues(
  type: ImportType,
  key: string,
  values: ImportValues,
): ImportValues | undefined {
  const date = String(values.date ?? '')
  switch (type) {
    case 'daily-prices':
    case 'history': {
      const security = findSecurity(String(values.code))
      const stored = security ? storedPrice(security.id, date) : undefined
      return stored && { ...stored }
    }
    case 'indices': {
      const today = toMarketDay(Date.now())
      const code = String(values.index)
      if (date === today && !currentOverlay().indexFiles.get(code)?.has(date)) return undefined
      const close = indexClose(code, date)
      return close === undefined ? undefined : { value: close }
    }
    case 'auctions': {
      const auction = currentAuctions().find((candidate) => auctionKey(candidate) === key)
      return (
        auction && {
          offered: auction.amountOffered,
          bids: auction.amountBid,
          allotted: auction.amountAllotted,
          avg_rate: auction.averageRate,
          marginal_rate: auction.marginalRate,
        }
      )
    }
    default: {
      // Curves, corporate actions, statements and securities: what the files published.
      const row = publishedRows(type).findLast(
        (candidate) => rowKey(type, candidate.values) === key,
      )
      return row && Object.fromEntries(STORED_COLUMNS[type].map((name) => [name, row.values[name]]))
    }
  }
}

function previousValue(type: ImportType, values: ImportValues): number | undefined {
  const date = String(values.date ?? '')
  if (type === 'daily-prices' || type === 'history') {
    const security = findSecurity(String(values.code))
    return security ? previousClose(security.id, date) : undefined
  }
  if (type === 'indices') return previousIndexClose(String(values.index), date)
  if (type === 'auctions') {
    const security = auctionSecurity(String(values.security))
    return currentAuctions().find(
      (auction) =>
        auction.country === values.country &&
        auction.instrument === security?.instrument &&
        auction.term === security.term &&
        auction.date < date,
    )?.averageRate
  }
  if (type === 'curves') {
    const years = curveYears(String(values.maturity))
    const country = String(values.country)
    const index = CURVE_MATURITIES.findIndex((maturity) => maturity === years)
    if (index < 0 || !(country in CURVE_FILE)) return undefined
    const published = publishedCurve(country, addDays(date, -1))
    return published?.rates[index] ?? CURVE_FILE[country as keyof typeof CURVE_FILE][index]
  }
  return undefined
}

function contextFor(type: ImportType, sessionDate: string): ImportContext {
  const today = toMarketDay(Date.now())
  return {
    sessionDate,
    isSession: (day) => day <= today && isSessionDay(day),
    isSecurity: (code) => findSecurity(code) !== undefined,
    isIndex: (code) => indices.has(code),
    stored: (key, values) => storedValues(type, key, values),
    previous: (values) => previousValue(type, values),
  }
}

export function checkImport(
  type: ImportType,
  sessionDate: string,
  rows: readonly { line: number; cells: Readonly<Record<string, Cell>> }[],
): CheckedRow[] {
  return checkRows(importTypeOf(type), rows, contextFor(type, sessionDate))
}

export function storedRows(checked: readonly CheckedRow[], prefix: string): StoredImportRow[] {
  return checked.map((row, index) => ({
    ...row,
    id: `${prefix}-r${index + 1}`,
    checked: false,
    edited: false,
  }))
}
