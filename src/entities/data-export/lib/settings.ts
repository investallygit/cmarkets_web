import type {
  ExportCatalogDto,
  ExportDatasetCode,
  ExportDatasetDto,
  ExportSettingsDto,
} from '@/shared/api/contracts'

/** Which list of the settings holds a dataset's selection. */
export type SelectionKey =
  'securities' | 'countries' | 'currencies' | 'series' | 'indices' | 'portfolios'

export const SELECTION_KEY: Record<ExportDatasetCode, SelectionKey | null> = {
  prices: 'securities',
  bonds: 'securities',
  curves: 'countries',
  portfolios: 'portfolios',
  fx: 'currencies',
  commodities: 'series',
  rfq: null,
  indices: 'indices',
}

/** The selection of settings: its items, whatever the dataset. */
export function selectionOf(settings: ExportSettingsDto): string[] {
  const key = SELECTION_KEY[settings.dataset]
  return key ? (settings[key] ?? []) : []
}

/** The settings with another selection. */
export function withSelection(settings: ExportSettingsDto, items: string[]): ExportSettingsDto {
  const key = SELECTION_KEY[settings.dataset]
  return key ? { ...settings, [key]: items } : settings
}

/** The first items a dataset proposes, as the mockup's (SEMC, BANGE, IWDA). */
const FIRST_ITEMS: Record<ExportDatasetCode, string[]> = {
  prices: ['SEMC', 'BANGE', 'IWDA'],
  bonds: ['ECMR-6.25-2029'],
  curves: ['CM'],
  portfolios: [],
  fx: ['USD'],
  commodities: ['BRENT'],
  rfq: [],
  indices: ['BVMAC-A'],
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * A dataset's settings as DL opens them: its usual fields, the last year (or less for a profile
 * that reaches back less), daily, XLSX one sheet per item (CSV for a profile limited to it), a
 * comma as the decimal mark in French, the profile's time zone.
 */
export function defaultSettings(
  dataset: ExportDatasetDto,
  limits: ExportCatalogDto['limits'],
  today: Date,
  language: 'fr' | 'en',
  timeZone: string,
): ExportSettingsDto {
  const to = isoDay(today)
  const yearAgo = new Date(today)
  yearAgo.setFullYear(today.getFullYear() - 1)
  const from =
    limits.earliest && limits.earliest > isoDay(yearAgo) ? limits.earliest : isoDay(yearAgo)
  const settings: ExportSettingsDto = {
    dataset: dataset.dataset,
    from,
    to,
    frequency: 'day',
    fields: [...dataset.defaultFields],
    format: limits.csvOnly ? 'csv' : 'xlsx',
    layout: 'sheets',
    decimal: language === 'fr' ? 'comma' : 'point',
    timeZone,
    ...(dataset.dataset === 'prices' ? { adjusted: false } : {}),
    ...(dataset.tables?.[0] ? { table: dataset.tables[0].table } : {}),
    ...(dataset.dataset === 'rfq' ? { statuses: [] } : {}),
  }
  const known = dataset.choices?.map((choice) => choice.code)
  const first = FIRST_ITEMS[dataset.dataset].filter((item) => !known || known.includes(item))
  return withSelection(settings, first.length > 0 ? first : (known?.slice(0, 1) ?? []))
}

/** Settings complete enough to ask a preview: a selection (the RFQ's agreements need none), a field, a period. */
export function isComplete(settings: ExportSettingsDto): boolean {
  return (
    (settings.dataset === 'rfq' || selectionOf(settings).length > 0) &&
    settings.fields.length > 0 &&
    Boolean(settings.from) &&
    Boolean(settings.to) &&
    settings.from <= settings.to
  )
}

/** Another table of the portfolios: its usual fields. */
export function withTable(
  settings: ExportSettingsDto,
  dataset: ExportDatasetDto,
  table: string,
): ExportSettingsDto {
  const fields = dataset.tables?.find((candidate) => candidate.table === table)?.defaultFields
  return { ...settings, table, fields: fields ? [...fields] : settings.fields }
}

/** The fields a dataset offers: its table's, for the portfolios. */
export function fieldsOf(dataset: ExportDatasetDto, settings: ExportSettingsDto): string[] {
  return (
    dataset.tables?.find((candidate) => candidate.table === settings.table)?.fields ??
    dataset.fields
  )
}

/**
 * The settings a Download button sends in DL's address (spec section 9, screen 30: "the same
 * window with the settings pre-filled"): ?dataset=prices&items=SEMC,BANGE&from=&to=&table=.
 */
export function settingsFromSearch(
  base: ExportSettingsDto,
  dataset: ExportDatasetDto,
  search: URLSearchParams,
): ExportSettingsDto {
  let settings = base
  const items = search.get('items')
  if (items) settings = withSelection(settings, items.split(',').filter(Boolean).slice(0, 100))
  const from = search.get('from')
  const to = search.get('to')
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) settings = { ...settings, from }
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) settings = { ...settings, to }
  const table = search.get('table')
  if (table && dataset.tables?.some((candidate) => candidate.table === table))
    settings = withTable(settings, dataset, table)
  return settings
}

/** DL's address with the settings of a screen's Download button. */
export function downloadSearch(
  dataset: ExportDatasetDto['dataset'],
  options: { items?: readonly string[]; from?: string; to?: string; table?: string } = {},
): string {
  const search = new URLSearchParams({ dataset })
  if (options.items?.length) search.set('items', options.items.join(','))
  if (options.from) search.set('from', options.from)
  if (options.to) search.set('to', options.to)
  if (options.table) search.set('table', options.table)
  return `?${search.toString()}`
}
