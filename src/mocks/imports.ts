import type {
  AuctionDto,
  CoverageDto,
  CoverageItemDto,
  DividendDto,
  ImportDto,
  ImportRowDto,
  ImportStatus,
  ImportType,
  ImportValues,
  PriceCorrectionDto,
  PriceCorrectionRequestDto,
  StoredPriceDto,
} from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { toMarketDay } from '@/shared/lib/format'
import { addDays } from '@/shared/lib/isoDate'
import type { RealtimeEventMap } from '@/shared/realtime'
import {
  auctions as auctionFixtures,
  calendar,
  currentAccount,
  indexDailyCloses,
  indices,
  recordAudit,
  securities,
  setStoredIndexCloses,
  sharedStore,
  type AuditActor,
} from './db'
import { allNews } from './content'
import { holidayEvents } from './fixtures/calendar'
import { CURVE_FILE, CURVE_MATURITIES, type CurveFile } from './fixtures/curves'
import {
  CURVES_UPLOAD,
  PENDING_AUCTIONS,
  UPLOAD_SEEDS,
  UPLOADERS,
  type Uploader,
} from './fixtures/imports'
import { PROFILE_FIXTURES } from './fixtures/profiles'
import { priceHistory, setStoredSessions, type StoredSession } from './lib/bars'
import { newId } from './lib/ids'
import {
  auctionSecurity,
  auctionSecurityLabel,
  checkRows,
  countRows,
  curveYears,
  importTypeOf,
  rowKey,
  rowStatus,
  STORED_COLUMNS,
  type CheckedRow,
  type ImportContext,
} from './lib/dataImport'
import type { Cell } from './lib/templateFile'
import { atUtc, isWeekday } from './lib/time'

/**
 * The Data admin's uploads (screen 6) and what they put in the database: published rows replace
 * the generated prices and index closes, add auctions, curve points and dividends; a rollback
 * takes them out again. Kept in localStorage like the rest of the prototype.
 */
export interface StoredImportRow extends CheckedRow {
  id: string
  checked: boolean
  edited: boolean
}

type LiveValues = { open: number; high: number; low: number; last: number; volume: number }

export interface StoredImport {
  id: string
  type: ImportType
  fileName: string
  sessionDate: string
  columns: string[]
  status: 'ready' | 'published' | 'rolledBack' | 'discarded'
  uploadedAt: string
  uploadedById: string
  uploadedBy: string
  /** The format checks run until this time (ms), then the business checks until readyAt. */
  formatUntil: number
  readyAt: number
  publishedAt: string | null
  publishedBy: string | null
  rollback: ImportDto['rollback']
  replacesId: string | null
  /** Seeded with the prototype: its rows repeat the generated data of their day. */
  seed?: boolean
  /** Live prices or index values before a publication of today's session, for a rollback. */
  liveBefore?: Record<string, LiveValues | number>
  rows: StoredImportRow[]
}

export interface StoredCorrection extends PriceCorrectionDto {
  correctedById: string
}

const FORMAT_MS = 700
const CHECKS_MS = 1_800
/** Sessions of the seeded upload history (screen 6 mockup: the last 7 days). */
const SEEDED_SESSIONS = 5

const DOUALA_UTC_OFFSET_HOURS = 1

/** A time in Douala on a day, as an ISO timestamp. */
function doualaTime(day: string, hhmm: string): string {
  const [hours, minutes] = hhmm.split(':').map(Number)
  return atUtc(day, hours - DOUALA_UTC_OFFSET_HOURS, minutes)
}

/** A weekday without a holiday. */
export function isSessionDay(day: string): boolean {
  return isWeekday(day) && holidayEvents(day, day).length === 0
}

/** The session the Data admin works on: today, or the last session day before it. */
export function currentSession(now = Date.now()): string {
  let day = toMarketDay(now)
  while (!isSessionDay(day)) day = addDays(day, -1)
  return day
}

function sessionsBefore(day: string, count: number): string[] {
  const days: string[] = []
  for (let candidate = day; days.length < count; candidate = addDays(candidate, -1)) {
    if (isSessionDay(candidate)) days.push(candidate)
  }
  return days
}

/** A security by its CMarket code (the id) or its display code. */
export function findSecurity(code: string) {
  const upper = code.trim().toUpperCase()
  return [...securities.values()].find(
    (security) =>
      security.id.toUpperCase() === upper ||
      security.code.toUpperCase() === upper ||
      security.aliases?.some((alias) => alias.toUpperCase() === upper),
  )
}

// ---------------------------------------------------------------------------------------------
// What the published files put in the database

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
/** While the store fills with its seeds, which read the generated data and nothing published. */
let seeding = false

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

function currentOverlay(): Overlay {
  if (seeding) return EMPTY_OVERLAY
  overlay ??= buildOverlay(importStore.read(), correctionStore.read())
  return overlay
}

setStoredSessions((securityId) => currentOverlay().sessions.get(securityId))
setStoredIndexCloses((code) => currentOverlay().indices.get(code))

const publishedRows = (type: ImportType) =>
  (seeding ? [] : importStore.read())
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

const auctionKey = (auction: Pick<AuctionDto, 'date' | 'country' | 'instrument' | 'term'>) =>
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

// ---------------------------------------------------------------------------------------------
// The checks against the database

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

function indexClose(code: string, day: string): number | undefined {
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

function checkImport(
  type: ImportType,
  sessionDate: string,
  rows: readonly { line: number; cells: Readonly<Record<string, Cell>> }[],
): CheckedRow[] {
  return checkRows(importTypeOf(type), rows, contextFor(type, sessionDate))
}

// ---------------------------------------------------------------------------------------------
// The store, seeded with the uploads of the screen 6 mockup

function storedRows(checked: readonly CheckedRow[], prefix: string): StoredImportRow[] {
  return checked.map((row, index) => ({
    ...row,
    id: `${prefix}-r${index + 1}`,
    checked: false,
    edited: false,
  }))
}

/** Published rows of a seeded file: what the database already holds. */
function seededRows(values: readonly ImportValues[], prefix: string): StoredImportRow[] {
  return values.map((row, index) => ({
    id: `${prefix}-r${index + 1}`,
    line: index + 2,
    values: row,
    issues: [],
    stored: null,
    diff: 'new',
    checked: false,
    edited: false,
  }))
}

function priceRows(day: string): ImportValues[] {
  return [...securities.values()].flatMap((security) => {
    const bar = priceHistory(security, day, day, '1d')[0]
    if (!bar) return []
    const { open, high, low, close, volume } = bar
    return [
      {
        date: day,
        code: security.id,
        open,
        high,
        low,
        close,
        volume,
        value: Math.round(close * volume),
      },
    ]
  })
}

function indexRows(day: string): ImportValues[] {
  return ['BVMAC-A', 'MCAP'].flatMap((code) => {
    const close = indexClose(code, day)
    return close === undefined ? [] : [{ date: day, index: code, value: close }]
  })
}

function auctionRows(day: string): ImportValues[] {
  return auctionFixtures
    .filter((auction) => auction.date === day)
    .map((auction) => ({
      date: day,
      country: auction.country,
      security: auctionSecurityLabel(auction.instrument, auction.term),
      maturity: auction.maturityDate,
      offered: auction.amountOffered,
      bids: auction.amountBid,
      allotted: auction.amountAllotted,
      avg_rate: auction.averageRate,
      marginal_rate: auction.marginalRate,
    }))
}

function curveRows(day: string): ImportValues[] {
  return CEMAC_COUNTRIES.flatMap((country) =>
    CURVE_MATURITIES.map((years, index) => ({
      date: day,
      country,
      maturity: years < 1 ? `${years * 12}M` : `${years}Y`,
      rate: CURVE_FILE[country][index],
    })),
  )
}

function dividendRows(): ImportValues[] {
  const dividend = PROFILE_FIXTURES.SAFACAM?.dividends[0]
  return dividend
    ? [
        {
          code: 'SAFACAM',
          type: 'dividend',
          ex_date: dividend.exDate,
          pay_date: dividend.paymentDate,
          amount: dividend.amount,
        },
      ]
    : []
}

const minutesLater = (iso: string, minutes: number) =>
  new Date(Date.parse(iso) + minutes * 60_000).toISOString()

function seededImport(
  id: string,
  type: ImportType,
  day: string,
  fileName: string,
  at: string,
  by: Uploader,
  rows: StoredImportRow[],
): StoredImport {
  const uploadedAt = doualaTime(day, at)
  return {
    id,
    type,
    fileName,
    sessionDate: day,
    columns: importTypeOf(type)
      .columns.map((column) => column.name)
      .filter((name) => rows.some((row) => row.values[name] !== undefined)),
    status: 'published',
    uploadedAt,
    uploadedById: by.id,
    uploadedBy: by.name,
    formatUntil: Date.parse(uploadedAt),
    readyAt: Date.parse(uploadedAt),
    publishedAt: minutesLater(uploadedAt, 2),
    publishedBy: by.name,
    rollback: null,
    replacesId: null,
    seed: true,
    rows,
  }
}

/**
 * The upload history of the screen 6 mockup over the last sessions, and the BEAC auctions file of
 * the latest session waiting in its preview. Uploads later than now are left for the user.
 */
function createImports(now = Date.now()): StoredImport[] {
  const sessions = sessionsBefore(currentSession(now), SEEDED_SESSIONS)
  const imports: StoredImport[] = []
  const rowsOf = (type: ImportType, day: string): ImportValues[] => {
    if (type === 'daily-prices') return priceRows(day)
    if (type === 'indices') return indexRows(day)
    if (type === 'auctions') return auctionRows(day)
    if (type === 'corporate-actions') return dividendRows()
    return []
  }
  UPLOAD_SEEDS.forEach((seed, index) => {
    const day = sessions[seed.sessionsAgo]
    if (!day || Date.parse(doualaTime(day, seed.at)) + 5 * 60_000 > now) return
    const id = `import-seed-${index + 1}`
    const values = rowsOf(seed.type, day)
    if (values.length === 0) return
    const stored = seededImport(
      id,
      seed.type,
      day,
      seed.fileName(day),
      seed.at,
      seed.by,
      seededRows(values, id),
    )
    if (seed.rollback) {
      stored.rollback = {
        at: doualaTime(day, seed.rollback.at),
        by: seed.by.name,
        reason: seed.rollback.reason,
      }
      stored.publishedAt = minutesLater(stored.rollback.at, 15)
    }
    imports.push(stored)
  })
  sessions
    .filter((day) => new Date(`${day}T12:00:00Z`).getUTCDay() === 5)
    .forEach((day) => {
      if (Date.parse(doualaTime(day, CURVES_UPLOAD.at)) + 5 * 60_000 > now) return
      const id = `import-seed-curves-${day}`
      imports.push(
        seededImport(
          id,
          'curves',
          day,
          CURVES_UPLOAD.fileName(day),
          CURVES_UPLOAD.at,
          CURVES_UPLOAD.by,
          seededRows(curveRows(day), id),
        ),
      )
    })

  // Waiting in its preview: one alert to tick, as in the mockup.
  const day = sessions[0]
  const uploadedAt = new Date(
    Math.min(Date.parse(doualaTime(day, PENDING_AUCTIONS.at)), now - 3 * 60_000),
  ).toISOString()
  const id = 'import-seed-auctions'
  const checked = checkImport(
    'auctions',
    day,
    PENDING_AUCTIONS.rows.map((row, index) => ({ line: index + 2, cells: { date: day, ...row } })),
  )
  imports.push({
    id,
    type: 'auctions',
    fileName: PENDING_AUCTIONS.fileName(day),
    sessionDate: day,
    columns: [
      'date',
      'country',
      'security',
      'offered',
      'bids',
      'allotted',
      'avg_rate',
      'marginal_rate',
    ],
    status: 'ready',
    uploadedAt,
    uploadedById: PENDING_AUCTIONS.by.id,
    uploadedBy: PENDING_AUCTIONS.by.name,
    formatUntil: Date.parse(uploadedAt),
    readyAt: Date.parse(uploadedAt),
    publishedAt: null,
    publishedBy: null,
    rollback: null,
    replacesId: null,
    rows: storedRows(checked, id),
  })
  return imports.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
}

/** The log of the seeded uploads: published two minutes after the upload, and rolled back. */
function auditSeeds(imports: readonly StoredImport[]): void {
  const uploaders = Object.values(UPLOADERS)
  for (const stored of imports) {
    if (!stored.seed || !stored.publishedAt) continue
    const uploader = uploaders.find((candidate) => candidate.id === stored.uploadedById)
    if (!uploader) continue
    const actor: AuditActor = {
      id: uploader.id,
      displayName: uploader.name,
      accountType: 'dataAdmin',
    }
    if (stored.rollback) {
      auditImport(stored, 'import-publish', 'ready', {
        actor,
        at: minutesLater(stored.uploadedAt, 2),
      })
      auditImport(stored, 'import-rollback', 'published', {
        actor,
        at: stored.rollback.at,
        reason: stored.rollback.reason,
      })
    }
    auditImport(stored, 'import-publish', stored.rollback ? 'rolledBack' : 'ready', {
      actor,
      at: stored.publishedAt,
    })
  }
}

export const importStore = sharedStore<StoredImport[]>('imports', () => {
  seeding = true
  try {
    const imports = createImports()
    auditSeeds(imports)
    return imports
  } finally {
    seeding = false
  }
})

export const correctionStore = sharedStore<StoredCorrection[]>('priceCorrections', () => [])

function saveImports(imports: StoredImport[]): void {
  importStore.write(imports)
  overlay = null
}

export function findImport(id: string): StoredImport | undefined {
  return importStore.read().find((stored) => stored.id === id)
}

// ---------------------------------------------------------------------------------------------
// The upload cycle (spec section 11)

type ImportEvent =
  | { name: 'ImportStatusChanged'; payload: RealtimeEventMap['ImportStatusChanged'] }
  | { name: 'DataPublished'; payload: RealtimeEventMap['DataPublished'] }

const listeners = new Set<(event: ImportEvent) => void>()

/** Progress of the checks and publications, for the simulated hub. */
export function onImportEvent(listener: (event: ImportEvent) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit(event: ImportEvent): void {
  listeners.forEach((listener) => listener(event))
}

export function statusOf(stored: StoredImport, now = Date.now()): ImportStatus {
  if (stored.status !== 'ready') return stored.status
  if (now < stored.formatUntil) return 'format'
  if (now < stored.readyAt) return 'checks'
  return 'ready'
}

const ZERO_COUNTS = { new: 0, changed: 0, unchanged: 0, alerts: 0, alertsChecked: 0, errors: 0 }

export function importDto(stored: StoredImport, now = Date.now()): ImportDto {
  const status = statusOf(stored, now)
  const checking = status === 'format' || status === 'checks'
  return {
    id: stored.id,
    type: stored.type,
    fileName: stored.fileName,
    sessionDate: stored.sessionDate,
    columns: stored.columns,
    status,
    counts: checking ? { read: stored.rows.length, ...ZERO_COUNTS } : countRows(stored.rows),
    uploadedAt: stored.uploadedAt,
    uploadedBy: stored.uploadedBy,
    publishedAt: stored.publishedAt,
    publishedBy: stored.publishedBy,
    rollback: stored.rollback,
    replacesId: stored.replacesId,
  }
}

export function rowDto(row: StoredImportRow): ImportRowDto {
  return {
    id: row.id,
    line: row.line,
    values: row.values,
    stored: row.diff === 'changed' ? row.stored : null,
    status: rowStatus(row),
    issues: row.issues,
    checked: row.checked,
    edited: row.edited,
  }
}

function announceChecks(stored: StoredImport): void {
  const { formatUntil, readyAt } = stored
  const report = () => {
    const current = findImport(stored.id)
    if (!current) return
    const dto = importDto(current)
    emit({
      name: 'ImportStatusChanged',
      payload: {
        importId: dto.id,
        status: dto.status,
        errors: dto.counts.errors,
        warnings: dto.counts.alerts,
      },
    })
  }
  window.setTimeout(report, Math.max(0, formatUntil - Date.now()))
  window.setTimeout(report, Math.max(0, readyAt - Date.now()) + 10)
}

/** POST /data/imports: the file is read now, its checks shown step by step. */
export function startImport(input: {
  type: ImportType
  fileName: string
  sessionDate: string
  rows: readonly { line: number; cells: Readonly<Record<string, Cell>> }[]
  columns: string[]
  replaces: StoredImport | undefined
}): StoredImport {
  const account = currentAccount()
  const now = Date.now()
  const id = newId('import')
  const stored: StoredImport = {
    id,
    type: input.type,
    fileName: input.fileName,
    sessionDate: input.sessionDate,
    columns: input.columns,
    status: 'ready',
    uploadedAt: new Date(now).toISOString(),
    uploadedById: account.id,
    uploadedBy: account.displayName,
    formatUntil: now + FORMAT_MS,
    readyAt: now + FORMAT_MS + CHECKS_MS,
    publishedAt: null,
    publishedBy: null,
    rollback: null,
    replacesId: input.replaces?.id ?? null,
    rows: storedRows(checkImport(input.type, input.sessionDate, input.rows), id),
  }
  const imports = importStore.read()
  if (input.replaces) input.replaces.status = 'discarded'
  saveImports([stored, ...imports])
  announceChecks(stored)
  return stored
}

/**
 * PATCH of a row: Fix row puts new values and runs the checks again on the whole file (a fix can
 * end a duplicate); an alert whose reason stays the same keeps its "checked" tick.
 */
export function patchRow(
  stored: StoredImport,
  rowId: string,
  patch: { values?: ImportValues; checked?: boolean },
): StoredImportRow | { error: string } {
  const row = stored.rows.find((candidate) => candidate.id === rowId)
  if (!row) return { error: 'No such row.' }
  if (patch.values) {
    const before = new Map(stored.rows.map((candidate) => [candidate.id, candidate]))
    const cells = stored.rows.map((candidate) => ({
      line: candidate.line,
      cells: candidate.id === rowId ? { ...candidate.values, ...patch.values } : candidate.values,
    }))
    const checked = checkImport(stored.type, stored.sessionDate, cells)
    stored.rows = stored.rows.map((candidate, index) => {
      const next = checked[index]
      const previous = before.get(candidate.id)
      const sameAlerts =
        previous !== undefined &&
        JSON.stringify(previous.issues) === JSON.stringify(next.issues) &&
        candidate.id !== rowId
      return {
        ...next,
        id: candidate.id,
        checked: sameAlerts ? candidate.checked : false,
        edited: candidate.edited || candidate.id === rowId,
      }
    })
  }
  const current = stored.rows.find((candidate) => candidate.id === rowId) ?? row
  if (patch.checked !== undefined) {
    if (rowStatus(current) !== 'alert')
      return { error: 'Only a row with an alert is ticked checked.' }
    current.checked = patch.checked
  }
  saveImports(
    importStore.read().map((candidate) => (candidate.id === stored.id ? stored : candidate)),
  )
  return current
}

function liveOf(id: string): LiveValues | undefined {
  const security = securities.get(id)
  if (!security) return undefined
  const { open, high, low, last, volume } = security
  return { open, high, low, last, volume }
}

/** Today's session published: the live prices and index values become the file's. */
function applyToday(stored: StoredImport): void {
  const today = toMarketDay(Date.now())
  if (stored.sessionDate !== today) return
  const before: Record<string, LiveValues | number> = {}
  for (const { values } of stored.rows) {
    if (stored.type === 'daily-prices' && values.date === today) {
      const security = findSecurity(String(values.code))
      const live = security && liveOf(security.id)
      if (!security || !live) continue
      before[security.id] = live
      Object.assign(security, {
        open: Number(values.open),
        high: Number(values.high),
        low: Number(values.low),
        last: Number(values.close),
        volume: Number(values.volume),
        updatedAt: new Date().toISOString(),
      })
    }
    if (stored.type === 'indices' && values.date === today) {
      const index = indices.get(String(values.index))
      if (!index) continue
      before[index.code] = index.value
      index.value = Number(values.value)
    }
  }
  stored.liveBefore = before
}

function restoreToday(stored: StoredImport): void {
  for (const [id, value] of Object.entries(stored.liveBefore ?? {})) {
    const security = securities.get(id)
    if (security && typeof value === 'object') Object.assign(security, value)
    const index = indices.get(id)
    if (index && typeof value === 'number') index.value = value
  }
  stored.liveBefore = undefined
}

function announcePublished(stored: StoredImport): void {
  emit({
    name: 'DataPublished',
    payload: { importId: stored.id, type: stored.type, date: stored.sessionDate },
  })
}

const importTarget = (stored: StoredImport) =>
  ({ type: 'import', id: stored.id, label: stored.fileName }) as const

/** The log of an upload's publication or rollback: its status and how many rows. */
function auditImport(
  stored: StoredImport,
  action: 'import-publish' | 'import-rollback' | 'import-discard',
  before: ImportStatus,
  options: { reason?: string | null; at?: string; actor?: AuditActor } = {},
): void {
  const after =
    action === 'import-publish'
      ? 'published'
      : action === 'import-rollback'
        ? 'rolledBack'
        : 'discarded'
  recordAudit(action, importTarget(stored), {
    changes: [
      { field: 'importStatus', scope: null, before, after },
      ...(action === 'import-discard'
        ? []
        : [
            { field: 'rows', scope: stored.type, before: null, after: stored.rows.length } as const,
          ]),
    ],
    ...options,
  })
}

/** POST /data/imports/{id}/publish: the rows go into the database; screens are told to refresh. */
export function publishImport(stored: StoredImport): void {
  const before = statusOf(stored)
  stored.status = 'published'
  stored.publishedAt = new Date().toISOString()
  stored.publishedBy = currentAccount().displayName
  applyToday(stored)
  saveImports(
    importStore.read().map((candidate) => (candidate.id === stored.id ? stored : candidate)),
  )
  auditImport(stored, 'import-publish', before)
  announcePublished(stored)
}

/** POST /data/imports/{id}/rollback: the previous values come back; the rows can be fixed again. */
export function rollBackImport(stored: StoredImport, reason: string): void {
  stored.status = 'rolledBack'
  stored.rollback = {
    at: new Date().toISOString(),
    by: currentAccount().displayName,
    reason,
  }
  restoreToday(stored)
  saveImports(
    importStore.read().map((candidate) => (candidate.id === stored.id ? stored : candidate)),
  )
  auditImport(stored, 'import-rollback', 'published', { reason })
  announcePublished(stored)
}

export function discardImport(stored: StoredImport): void {
  const before = statusOf(stored)
  stored.status = 'discarded'
  saveImports(
    importStore.read().map((candidate) => (candidate.id === stored.id ? stored : candidate)),
  )
  auditImport(stored, 'import-discard', before)
}

// ---------------------------------------------------------------------------------------------
// Session coverage

const COVERAGE_ORDER: readonly (ImportType | 'news')[] = [
  'daily-prices',
  'indices',
  'corporate-actions',
  'auctions',
  'curves',
  'news',
  'financial-statements',
  'securities',
  'history',
]

/** Friday of the week of a day: when the weekly curves file is due. */
function fridayOf(day: string): string {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay()
  return addDays(day, 5 - weekday)
}

/** GET /data/coverage: the files expected for a session and where each one stands. */
export function coverage(date: string, now = Date.now()): CoverageDto {
  const today = toMarketDay(now)
  const imports = importStore.read()
  const items = COVERAGE_ORDER.flatMap((type): CoverageItemDto[] => {
    if (type === 'news') {
      const count = allNews().filter((item) => toMarketDay(item.publishedAt) === date).length
      return [
        {
          type,
          status: count > 0 ? 'published' : 'none',
          published: count,
          lastPublishedAt: null,
          dueOn: null,
          importId: null,
        },
      ]
    }
    const forDay = imports
      .filter((stored) => stored.type === type && stored.sessionDate === date)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    const published = forDay.filter((stored) => stored.status === 'published')
    const pending = forDay.filter(
      (stored) => stored.status === 'ready' || stored.status === 'rolledBack',
    )
    const latest = forDay.find((stored) => stored.status !== 'discarded')
    const { frequency } = importTypeOf(type)
    if ((frequency === 'once' || type === 'securities') && forDay.length === 0) return []
    let dueOn: string | null = null
    if (frequency === 'session' && isSessionDay(date)) dueOn = date
    if (frequency === 'weekly') dueOn = fridayOf(date)
    if (
      frequency === 'auction' &&
      calendar.some((event) => event.type === 'auction' && event.date === date)
    ) {
      dueOn = date
    }
    const status: CoverageItemDto['status'] =
      pending.length > 0
        ? 'checking'
        : published.length > 0
          ? 'published'
          : dueOn === null
            ? 'none'
            : dueOn > date || dueOn >= today
              ? 'expected'
              : 'missing'
    return [
      {
        type,
        status,
        published: published.length,
        lastPublishedAt:
          published
            .map((stored) => stored.publishedAt ?? '')
            .sort()
            .at(-1) ?? null,
        dueOn: status === 'expected' || status === 'missing' ? dueOn : null,
        importId: latest?.id ?? null,
      },
    ]
  })
  return { date, items }
}

// ---------------------------------------------------------------------------------------------
// Manual corrections (CORR)

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
  overlay = null
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
