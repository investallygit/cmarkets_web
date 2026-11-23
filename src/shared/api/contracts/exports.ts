import type { IsoDate, IsoDateTime } from './common'

/**
 * DL, data download (spec section 9, screen 30, fifth version; ROADMAP step 57): the datasets, the
 * settings of a file, its preview and estimate, "My downloads" and "My limits". CMarket.Api's
 * /exports (phase 45, ADR-071).
 */

/** The datasets in the spec's order. */
export const EXPORT_DATASETS = [
  'prices',
  'bonds',
  'curves',
  'portfolios',
  'fx',
  'commodities',
  'rfq',
  'indices',
] as const
export type ExportDatasetCode = (typeof EXPORT_DATASETS)[number]

export type ExportFormat = 'csv' | 'xlsx' | 'json'
export type ExportFrequency = 'day' | 'week' | 'month'
export type ExportLayout = 'sheets' | 'table'
export type ExportStatus = 'inProgress' | 'ready' | 'failed' | 'expired'

/** An item of a selection: a country, a currency, a series, an index. */
export interface ExportChoiceDto {
  code: string
  nameEn: string
  nameFr: string
}

/** A table of a dataset of several (the portfolios: performance, positions, transactions). */
export interface ExportTableDto {
  table: string
  fields: string[]
  defaultFields: string[]
}

export interface ExportDatasetDto {
  dataset: ExportDatasetCode
  /** The command bar codes of the screens it comes from. */
  screens: string[]
  fields: string[]
  defaultFields: string[]
  /** The securities are searched instead. */
  choices?: ExportChoiceDto[]
  /** The curves' tenors, shortest first. */
  tenors?: string[]
  /** The portfolios' tables; fields and defaultFields are the first's. */
  tables?: ExportTableDto[]
  /** The RFQ agreements' statuses. */
  statuses?: string[]
}

/** "My limits"; null means unlimited. */
export interface ExportLimitsDto {
  profile: string
  perDay: number | null
  usedToday: number
  rowsPerFile: number | null
  historyYears: number | null
  earliest: IsoDate | null
  csvOnly: boolean
  schedules: number | null
  schedulesUsed: number
  /** Above it, a job prepares the file (50,000). */
  immediateRows: number
}

export interface ExportCatalogDto {
  datasets: ExportDatasetDto[]
  limits: ExportLimitsDto
  /** The sources the Admin keeps on the screens only ("eodhd"; ROADMAP decision 41). */
  sourcesOff: string[]
}

/** The settings of a file, as DL sends them; the selection's list follows the dataset. */
export interface ExportSettingsDto {
  dataset: ExportDatasetCode
  securities?: string[]
  countries?: string[]
  tenors?: string[]
  currencies?: string[]
  series?: string[]
  indices?: string[]
  /** The portfolios' ids. */
  portfolios?: string[]
  /** A table of the portfolios. */
  table?: string
  /** The RFQ agreements' statuses, and the user's role in them. */
  statuses?: string[]
  role?: 'requester' | 'responder'
  from: IsoDate
  to: IsoDate
  frequency: ExportFrequency
  adjusted?: boolean
  fields: string[]
  format: ExportFormat
  layout: ExportLayout
  decimal: 'comma' | 'point'
  timeZone: string
}

export interface ExportEstimateDto {
  rows: number
  groups: number
  bytes: number
  /** Above 50,000 rows: prepared in the background. */
  background: boolean
}

/** A cell of the preview: a date (ISO), a number, a text, or nothing. */
export type ExportCell = string | number | null

export interface ExportPreviewDto {
  dataset: ExportDatasetCode
  fields: string[]
  code: string | null
  name: string | null
  rows: ExportCell[][]
  estimate: ExportEstimateDto
}

export interface ExportDto {
  id: string
  dataset: ExportDatasetCode
  /** "SEMC, BANGE, IWDA · 01/01/2021 – 12/11/2026". */
  summary: string
  format: ExportFormat
  rows: number
  status: ExportStatus
  /** 0 to 100 while in progress. */
  progress: number
  fileName?: string
  sizeBytes?: number
  createdAt: IsoDateTime
  readyAt?: IsoDateTime
  expiresAt: IsoDateTime
  error?: string
}

export type ExportScheduleFrequency = 'daily' | 'weekly' | 'monthly'

/** A scheduled export: made again at 06:00 in Douala, each day, each Monday or the first of each month. */
export interface ExportScheduleDto {
  id: string
  dataset: ExportDatasetCode
  summary: string
  frequency: ExportScheduleFrequency
  email: boolean
  nextRunAt: IsoDateTime
  lastRunAt?: IsoDateTime
}

export interface ExportScheduleWriteDto {
  settings: ExportSettingsDto
  frequency: ExportScheduleFrequency
  email: boolean
}

/** A download of the Admin's log (USER, screen 9): who, which dataset, the settings, the rows. */
export interface ExportLogRowDto {
  id: string
  createdAt: IsoDateTime
  userId: string
  user: string
  email: string
  accountType: string
  dataset: ExportDatasetCode
  summary: string
  format: ExportFormat
  rows: number
  status: ExportStatus | 'deleted'
}

/** The sources DL downloads (ADMCFG, ROADMAP decision 41). */
export interface ExportSourcesDto {
  files: boolean
  cmarket: boolean
  eodhd: boolean
}

/** A profile's limits of DL; null means unlimited. */
export interface ExportLimitDto {
  accountType: string
  perDay: number | null
  rowsPerFile: number | null
  historyYears: number | null
  csvOnly: boolean
  schedules: number | null
}

export interface ExportAdminSettingsDto {
  sources: ExportSourcesDto
  limits: ExportLimitDto[]
}
