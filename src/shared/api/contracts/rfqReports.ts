import type { IsoDate, IsoDateTime } from './common'

// Screen 24, RFQ REP (spec section 10, "Daily reporting to the BEAC"; ROADMAP step 47, CMarket.Api's
// phase 38): each business day, the agreements concluded on the platform since the previous send,
// excluding cancelled ones, e-mailed to the BEAC as a one-page PDF and an Excel file. The Admin's
// (decision 17), `rfq:report` (decision 18), behind the RFQ's switch (decision 24).

/**
 * A business day's report. Scheduled until made; Skipped, a day without trades while the nil
 * report is off (not one of the spec's five: an open question).
 */
export type DailyReportStatus = 'scheduled' | 'sent' | 'nilSent' | 'failed' | 'resent' | 'skipped'

/** A government security of the BEAC's market: a BTA is quoted in rate alone, an OTA in price. */
export type BeacSecurityType = 'BTA' | 'OTA'

/** A business day of GET /rfq/daily-reports?month=yyyy-MM. */
export interface DailyReportDayDto {
  date: IsoDate
  status: DailyReportStatus
  agreementCount: number
  /** XAF. */
  faceAmount: number
  /** The latest send; for a day to come, the time it is scheduled. */
  sentAt: IsoDateTime | null
}

/** GET /rfq/daily-reports?month=yyyy-MM: the month's business days, newest first. */
export interface DailyReportMonthDto {
  /** yyyy-MM */
  month: string
  days: DailyReportDayDto[]
  nextSendAt: IsoDateTime | null
}

/** "1. By security": face-weighted averages. */
export interface DailyReportSecurityDto {
  securityId: string
  code: string
  name: string
  type: BeacSecurityType
  agreementCount: number
  faceAmount: number
  /** Clean price, % of the face amount; null for a BTA, quoted in rate alone (the mockup). */
  averagePrice: number | null
  averageRatePct: number
}

/** "2. By residual maturity", from the report's day to the security's maturity. */
export type ResidualMaturityBucket =
  | 'upTo3Months'
  | 'from3To6Months'
  | 'from6To12Months'
  | 'from1To3Years'
  | 'from3To5Years'
  | 'over5Years'

export interface DailyReportMaturityDto {
  bucket: ResidualMaturityBucket
  faceAmount: number
  sharePct: number
}

/** The PDF's key figures and tables; XAF. */
export interface DailyReportFiguresDto {
  agreementCount: number
  faceAmount: number
  /** Indicative: the amount settled is the SVTs' at the CRCT. */
  settlementAmount: number
  securityCount: number
  bySecurity: DailyReportSecurityDto[]
  /** The six buckets, in order, empty ones included. */
  byMaturity: DailyReportMaturityDto[]
  /** The PDF's "Cancellations" line: agreements reported before and cancelled in the period. */
  cancellations: { agreementCount: number; faceAmount: number }
}

export type DailyReportFileKind = 'summary' | 'transactions'

/** An attachment as sent: the mockup's "CMarket_BEAC_synthese_20261029.pdf · Summary · 1 page". */
export interface DailyReportFileDto {
  kind: DailyReportFileKind
  fileName: string
  /** Bytes. */
  size: number
  /** The summary's. */
  pages: number | null
  /** The list's: its rows and columns. */
  rows: number | null
  columns: number | null
  sha256: string
}

export interface DailyReportRecipientsDto {
  /** The BEAC's address. */
  to: string
  copies: string[]
}

/** A send logged: "time, recipients, file fingerprints". */
export interface DailyReportSendDto {
  at: IsoDateTime
  /** The Admin who sent it; null for the automatic send. */
  by: string | null
  recipients: DailyReportRecipientsDto
  status: 'sent' | 'failed'
  error: string | null
  summarySha256: string
  /** Null for a nil report, which has no Excel file. */
  transactionsSha256: string | null
}

/**
 * GET /rfq/daily-reports/{date}: the day's figures and its send panel. A day not made yet is a
 * preview of its figures so far; once made, the files are the bytes sent.
 */
export interface DailyReportDto {
  date: IsoDate
  status: DailyReportStatus
  preview: boolean
  /** From the previous report's end (null before the first) to the send time, or a Send now. */
  period: { from: IsoDateTime | null; to: IsoDateTime }
  madeAt: IsoDateTime | null
  figures: DailyReportFiguresDto
  /** "CMarket · BTA/OTA trades · 29/10/2026" */
  subject: string
  recipients: DailyReportRecipientsDto
  /** None before the day is made; the summary alone for a nil report. */
  files: DailyReportFileDto[]
  /** The Excel file's columns, in order (the spec's 17, then the status: an open question). */
  columns: string[]
  sends: DailyReportSendDto[]
}

/** GET /admin/rfq/daily-report-settings: what the header shows, and the settings. */
export interface DailyReportSettingsDto {
  /** HH:mm, Douala; on the BEAC's business days. */
  sendTime: string
  beacAddress: string
  /** 10 at most. */
  copies: string[]
  /** Send a nil report on a day without trades. */
  nilReport: boolean
  nextSendAt: IsoDateTime | null
  lastSend: { date: IsoDate; status: DailyReportStatus; at: IsoDateTime } | null
  updatedAt: IsoDateTime | null
  /** Row version, sent back with PUT; 409 when another Admin changed them meanwhile. */
  version: string
}

/** PUT /admin/rfq/daily-report-settings */
export interface DailyReportSettingsInput {
  sendTime: string
  beacAddress: string
  copies: string[]
  nilReport: boolean
  version: string
}
