import type { IsoDate, IsoDateTime } from './common'

/** Files the Data admin uploads for the African markets (spec section 11). */
export type ImportType =
  | 'daily-prices'
  | 'indices'
  | 'securities'
  | 'corporate-actions'
  | 'financial-statements'
  | 'auctions'
  /** The CEMAC states' sovereign yields by tenor (CEMAC_SOV_YIELDS, fourth version of the spec). */
  | 'cemac-sov-yields'
  /** "Curves and rates", the weekly file it replaced: its uploads stay in the history. */
  | 'curves'
  | 'history'
  | 'bond-master'
  | 'bond-ratings'
  | 'etf-profiles'
  | 'etf-nav'
  /** The yearly figures the World Bank does not publish for an economy, with their source (MACRO). */
  | 'macro'

/** How often a file is expected: each session, each auction, weekly, or when there is news. */
export type ImportFrequency = 'session' | 'auction' | 'weekly' | 'onDemand' | 'periodic' | 'once'

/** How a column is read: rates and amounts are numbers, codes are matched to the database. */
export type ImportColumnKind = 'date' | 'code' | 'text' | 'number' | 'integer' | 'rate'

export interface ImportColumnDto {
  /** Header of the column in the template, e.g. "close" or "avg_rate". */
  name: string
  kind: ImportColumnKind
  required: boolean
}

/** Checks of spec section 11: the format of each cell, then the business rules. */
export type ImportCheckCode =
  | 'missingValue'
  | 'notADate'
  | 'notANumber'
  | 'negative'
  | 'unknownValue'
  | 'inconsistentPrices'
  | 'inconsistentAmounts'
  | 'inconsistentDates'
  | 'unknownSecurity'
  | 'unknownIndex'
  | 'unknownCountry'
  | 'duplicate'
  | 'notASession'
  | 'otherSession'
  | 'changeAboveThreshold'
  | 'zeroVolumeChanged'
  | 'codeTaken'
  /** The row replaces the point stored for its key, which the CEMAC sovereign yields file confirms. */
  | 'replacesStored'

/** GET /data/import-types: the columns and the checks of each file. */
export interface ImportTypeDto {
  type: ImportType
  frequency: ImportFrequency
  columns: ImportColumnDto[]
  /** Business checks run on the file, after the format checks. */
  checks: ImportCheckCode[]
  /** A change from the stored value above this raises an alert: percent for prices, points for rates. */
  changeThreshold: { value: number; unit: 'pct' | 'pt' } | null
}

/**
 * format and checks: the checks are running (ImportStatusChanged reports each step); ready: the
 * preview, to publish once no error and no unchecked alert remains; rolledBack: the publication
 * was undone, the rows can be fixed and published again.
 */
export type ImportStatus = 'format' | 'checks' | 'ready' | 'published' | 'rolledBack' | 'discarded'

export interface ImportCountsDto {
  read: number
  new: number
  changed: number
  unchanged: number
  /** Rows with an alert, ticked "checked" or not. */
  alerts: number
  alertsChecked: number
  errors: number
}

/** GET /data/imports/{id}, and each upload of GET /data/imports. */
export interface ImportDto {
  id: string
  type: ImportType
  fileName: string
  /** Session the file is for. */
  sessionDate: IsoDate
  /** Template columns found in the file, in the template's order. */
  columns: string[]
  status: ImportStatus
  /** Known once the checks are done; zero before. */
  counts: ImportCountsDto
  uploadedAt: IsoDateTime
  uploadedBy: string
  publishedAt: IsoDateTime | null
  publishedBy: string | null
  /** Kept after a new publication: the history then shows "rolled back, republished". */
  rollback: { at: IsoDateTime; by: string; reason: string } | null
  /** The upload this file replaced (Replace file). */
  replacesId: string | null
}

export type ImportRowStatus = 'new' | 'changed' | 'unchanged' | 'alert' | 'error'

/** Cells by template column: a number or an ISO date once read, the text as written otherwise. */
export type ImportValues = Record<string, string | number | null>

export interface ImportIssueDto {
  code: ImportCheckCode
  /** An error blocks the publication; an alert must be ticked "checked". */
  severity: 'error' | 'alert'
  column: string | null
  /** Figures of the message, such as the change and the threshold. */
  params: Record<string, string | number>
  /** The server's wording in English, for logs. */
  message: string
}

/** GET /data/imports/{id}/rows?status=: each row, and what the database holds for its key. */
export interface ImportRowDto {
  id: string
  /** Line in the file, the header being line 1. */
  line: number
  values: ImportValues
  /** The stored values of a changed row. */
  stored: ImportValues | null
  status: ImportRowStatus
  issues: ImportIssueDto[]
  /** An alert ticked "checked" by the Data admin. */
  checked: boolean
  /** Fixed on screen (Fix row). */
  edited: boolean
}

/** PATCH /data/imports/{id}/rows/{rowId}: Fix row, or the "Alert checked" tick. */
export interface ImportRowPatchDto {
  values?: ImportValues
  checked?: boolean
}

/** POST /data/imports/{id}/rollback */
export interface ImportRollbackDto {
  reason: string
}

/** published, checking, expected later, missing after its session, or none expected. */
export type CoverageStatus = 'published' | 'checking' | 'expected' | 'missing' | 'none'

export interface CoverageItemDto {
  /** A file type, or the news entered for the session. */
  type: ImportType | 'news'
  status: CoverageStatus
  /** Files published for the session; news items for news. */
  published: number
  lastPublishedAt: IsoDateTime | null
  /** When an expected file is due. */
  dueOn: IsoDate | null
  /** The time of Douala it is due at, "17:30", for the file that has one (the CEMAC sovereign yields). */
  dueTime: string | null
  /** The latest upload for the session, to open it. */
  importId: string | null
}

/** GET /data/coverage?date= */
export interface CoverageDto {
  date: IsoDate
  items: CoverageItemDto[]
}

/**
 * The loads of spec section 11: closing prices after each close, fundamentals at night, the news,
 * and the ETFs' data (their benchmarks each evening, their profiles and distributions each week).
 */
export type EodhdJob = 'us-eod' | 'europe-eod' | 'fundamentals' | 'news' | 'etfs'

export interface EodhdRunDto {
  id: string
  job: EodhdJob
  startedAt: IsoDateTime
  durationSeconds: number
  status: 'ok' | 'failed'
  /** Securities loaded. */
  symbols: number
  /** Calls counted against the quota (a bulk call counts 100). */
  calls: number
  error: string | null
}

/** GET /data/providers/eodhd/status: the connector, its quota and its latest loads. */
export interface EodhdStatusDto {
  status: 'operational' | 'degraded' | 'down'
  /** The latest run of each job. */
  latest: EodhdRunDto[]
  /** Runs of the last 7 days, newest first. */
  runs: EodhdRunDto[]
  callsToday: number
  dailyQuota: number
  /** 429 answers over the last 24 hours. */
  rateLimited24h: number
  lastError: { at: IsoDateTime; message: string } | null
  checkedAt: IsoDateTime
}

/** One session of a security as stored, GET /data/securities/{id}/prices?from=&to=. */
export interface StoredPriceDto {
  date: IsoDate
  open: number
  high: number
  low: number
  close: number
  volume: number
  /** The file that brought it, or the initial backfill. */
  source: 'file' | 'backfill' | 'correction'
  importId: string | null
  correctedAt: IsoDateTime | null
}

/** PUT /data/securities/{id}/prices/{date}: a manual correction, logged with its reason. */
export interface PriceCorrectionRequestDto {
  open: number
  high: number
  low: number
  close: number
  volume: number
  reason: string
}

/** GET /data/corrections: the log of manual corrections. */
export interface PriceCorrectionDto {
  id: string
  securityId: string
  date: IsoDate
  before: Omit<PriceCorrectionRequestDto, 'reason'>
  after: Omit<PriceCorrectionRequestDto, 'reason'>
  reason: string
  correctedAt: IsoDateTime
  correctedBy: string
}

/** A text the Data admin wrote: when, and by whom, last. */
export interface WrittenDescriptionDto {
  text: string
  updatedAt: IsoDateTime
  updatedBy: string
}

/**
 * GET and PUT /data/securities/{id}/description (CORR): the Data admin's French and English, and
 * EODHD's English kept apart, which the screens show where the Data admin wrote no English.
 */
export interface StoredDescriptionDto {
  securityId: string
  fr: WrittenDescriptionDto | null
  en: WrittenDescriptionDto | null
  eodhd: { text: string; updatedAt: IsoDateTime } | null
}

/** PUT /data/securities/{id}/description: each language's text, empty or null to remove it. */
export interface DescriptionWriteDto {
  fr: string | null
  en: string | null
}
