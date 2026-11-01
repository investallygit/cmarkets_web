import type { ImportType, ImportValues } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { auctions as auctionFixtures, securities, type AuditActor } from '../db'
import { CURVE_FILE, CURVE_MATURITIES } from '../fixtures/curves'
import {
  CURVES_UPLOAD,
  PENDING_AUCTIONS,
  UPLOAD_SEEDS,
  UPLOADERS,
  type Uploader,
} from '../fixtures/imports'
import { PROFILE_FIXTURES } from '../fixtures/profiles'
import { priceHistory } from '../lib/bars'
import { auctionSecurityLabel, importTypeOf } from '../lib/dataImport'
import { checkImport, indexClose, storedRows } from './checks'
import { auditImport } from './cycle'
import { currentSession, doualaTime, sessionsBefore } from './lookups'
import { setImportSeeds, type StoredImport, type StoredImportRow } from './store'

/** The seeds of the upload store: the uploads of the screen 6 mockup and their audit log. */

/** Sessions of the seeded upload history (screen 6 mockup: the last 7 days). */
const SEEDED_SESSIONS = 5

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

setImportSeeds(() => {
  const imports = createImports()
  auditSeeds(imports)
  return imports
})
