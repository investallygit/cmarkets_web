import type {
  FinancialLineKey,
  ImportCheckCode,
  ImportColumnDto,
  ImportCountsDto,
  ImportIssueDto,
  ImportRowStatus,
  ImportType,
  ImportTypeDto,
  ImportValues,
} from '@/shared/api/contracts'
import { isCemacCountry } from '@/shared/config/countries'
import { cellDate, cellNumber, cellText, type Cell } from './templateFile'

const column = (name: string, kind: ImportColumnDto['kind'], required = true): ImportColumnDto => ({
  name,
  kind,
  required,
})

const PRICE_COLUMNS = [
  column('date', 'date'),
  column('code', 'code'),
  column('open', 'number'),
  column('high', 'number'),
  column('low', 'number'),
  column('close', 'number'),
  column('volume', 'integer'),
  // Value traded: kept with the file, not stored with the prices.
  column('value', 'number', false),
]

/** The file templates of spec section 11: their columns, checks and alert threshold. */
// prettier-ignore
export const IMPORT_TYPES: readonly ImportTypeDto[] = [
  { type: 'daily-prices', frequency: 'session', columns: PRICE_COLUMNS,
    checks: ['unknownSecurity', 'duplicate', 'notASession', 'otherSession', 'changeAboveThreshold', 'zeroVolumeChanged'],
    changeThreshold: { value: 15, unit: 'pct' } },
  { type: 'indices', frequency: 'session', columns: [column('date', 'date'), column('index', 'code'), column('value', 'number')],
    checks: ['unknownIndex', 'duplicate', 'notASession', 'otherSession', 'changeAboveThreshold'],
    changeThreshold: { value: 5, unit: 'pct' } },
  { type: 'corporate-actions', frequency: 'onDemand',
    columns: [column('code', 'code'), column('type', 'text'), column('ex_date', 'date'), column('pay_date', 'date'), column('amount', 'number')],
    checks: ['unknownSecurity', 'duplicate'], changeThreshold: null },
  { type: 'auctions', frequency: 'auction',
    columns: [column('date', 'date'), column('country', 'text'), column('security', 'text'), column('maturity', 'date', false),
      column('offered', 'number'), column('bids', 'number'), column('allotted', 'number'), column('avg_rate', 'rate'), column('marginal_rate', 'rate')],
    checks: ['unknownCountry', 'duplicate', 'notASession', 'otherSession', 'changeAboveThreshold'],
    changeThreshold: { value: 1, unit: 'pt' } },
  { type: 'curves', frequency: 'weekly',
    columns: [column('date', 'date'), column('country', 'text'), column('maturity', 'text'), column('rate', 'rate')],
    checks: ['unknownCountry', 'duplicate', 'otherSession', 'changeAboveThreshold'],
    changeThreshold: { value: 1, unit: 'pt' } },
  { type: 'financial-statements', frequency: 'periodic',
    columns: [column('code', 'code'), column('fiscal_year', 'integer'), column('line_item', 'text'), column('value', 'number')],
    checks: ['unknownSecurity', 'duplicate'], changeThreshold: null },
  { type: 'securities', frequency: 'onDemand',
    columns: [column('code', 'code'), column('isin', 'code'), column('name', 'text'), column('type', 'text'), column('sector', 'text'),
      column('country', 'text'), column('shares', 'integer', false), column('currency', 'code')],
    checks: ['unknownCountry', 'duplicate'], changeThreshold: null },
  { type: 'history', frequency: 'once', columns: PRICE_COLUMNS,
    checks: ['unknownSecurity', 'duplicate', 'notASession', 'changeAboveThreshold', 'zeroVolumeChanged'],
    changeThreshold: { value: 15, unit: 'pct' } },
]

export function isImportType(value: string): value is ImportType {
  return IMPORT_TYPES.some((definition) => definition.type === value)
}

export function importTypeOf(type: ImportType): ImportTypeDto {
  const definition = IMPORT_TYPES.find((candidate) => candidate.type === type)
  if (!definition) throw new Error(`Unknown import type ${type}`)
  return definition
}

/** Country names as files write them, in English or French, to their ISO codes. */
const COUNTRY_ALIASES: Record<string, string> = {
  CAMEROON: 'CM',
  CAMEROUN: 'CM',
  GABON: 'GA',
  CONGO: 'CG',
  CHAD: 'TD',
  TCHAD: 'TD',
  CAR: 'CF',
  RCA: 'CF',
  'CENTRAL AFRICAN REPUBLIC': 'CF',
  'REPUBLIQUE CENTRAFRICAINE': 'CF',
  'EQUATORIAL GUINEA': 'GQ',
  'GUINEE EQUATORIALE': 'GQ',
  'EQ. GUINEA': 'GQ',
}

export function countryCode(text: string): string | null {
  const upper = text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase()
  if (isCemacCountry(upper)) return upper
  return COUNTRY_ALIASES[upper] ?? null
}

/** "BTA 26 wk", "OTA 3 yr": the instrument and its term in weeks or years. */
export function auctionSecurity(text: string): { instrument: 'BTA' | 'OTA'; term: number } | null {
  const match = /^(BTA|OTA)\s*(\d{1,3})\s*(wk|w|weeks?|sem\.?|semaines?|yr|y|years?|ans?)?$/i.exec(
    text.trim(),
  )
  if (!match) return null
  const instrument = match[1].toUpperCase() as 'BTA' | 'OTA'
  return { instrument, term: Number(match[2]) }
}

export function auctionSecurityLabel(instrument: 'BTA' | 'OTA', term: number): string {
  return `${instrument} ${term} ${instrument === 'BTA' ? 'wk' : 'yr'}`
}

/** Curve maturities in years: 3M, 6M, 1Y... as the curves file writes them. */
const CURVE_MATURITIES: Record<string, number> = {
  '3M': 0.25,
  '6M': 0.5,
  '1Y': 1,
  '2Y': 2,
  '3Y': 3,
  '5Y': 5,
  '7Y': 7,
  '10Y': 10,
}

export function curveYears(text: string): number | null {
  return CURVE_MATURITIES[text.trim().toUpperCase().replace(/\s+/g, '')] ?? null
}

const ACTION_TYPES = ['dividend', 'coupon', 'amortization', 'split'] as const
const SECURITY_TYPES = ['equity', 'bond'] as const
// prettier-ignore
const LINE_ITEMS: readonly FinancialLineKey[] = [
  'revenue', 'ebitda', 'operatingIncome', 'netIncome', 'eps', 'netMargin', 'roe', 'totalAssets',
  'shareholdersEquity', 'financialDebt', 'cash', 'netFinancialDebt', 'bookValuePerShare',
  'operatingCashFlow', 'capitalExpenditure', 'freeCashFlow', 'dividendsPaid',
]

type IssueParams = Record<string, string | number>

function issue(
  code: ImportCheckCode,
  severity: ImportIssueDto['severity'],
  column: string | null,
  message: string,
  params: IssueParams = {},
): ImportIssueDto {
  return { code, severity, column, params, message }
}

const error = (
  code: ImportCheckCode,
  column: string | null,
  message: string,
  params?: IssueParams,
) => issue(code, 'error', column, message, params)

/** Each cell read by the kind of its column: dates in ISO, figures as numbers, codes upper-case. */
export function readValues(
  definition: ImportTypeDto,
  cells: Readonly<Record<string, Cell>>,
): { values: ImportValues; issues: ImportIssueDto[] } {
  const values: ImportValues = {}
  const issues: ImportIssueDto[] = []
  for (const { name, kind, required } of definition.columns) {
    const cell = cells[name] ?? null
    const text = cellText(cell)
    if (text === '') {
      values[name] = null
      if (required) issues.push(error('missingValue', name, `${name}: a value is needed.`))
      continue
    }
    if (kind === 'date') {
      const date = cellDate(cell)
      values[name] = date ?? text
      if (!date) issues.push(error('notADate', name, `${name}: "${text}" is not a date.`, { text }))
    } else if (kind === 'number' || kind === 'rate' || kind === 'integer') {
      const number = cellNumber(cell)
      const whole = kind !== 'integer' || (number !== null && Number.isInteger(number))
      if (number === null || Number.isNaN(number) || !whole) {
        values[name] = text
        issues.push(error('notANumber', name, `${name}: "${text}" is not a number.`, { text }))
      } else {
        values[name] = number
        if (number < 0) issues.push(error('negative', name, `${name}: a negative value.`))
      }
    } else {
      values[name] = kind === 'code' ? text.toUpperCase() : text
    }
  }
  if (issues.length === 0) issues.push(...normalize(definition.type, values))
  return { values, issues }
}

const unknownValue = (name: string, text: string) =>
  error('unknownValue', name, `${name}: "${text}" is not expected here.`, { text })

/** Values written several ways in the files, and the cells that must agree with each other. */
function normalize(type: ImportType, values: ImportValues): ImportIssueDto[] {
  const issues: ImportIssueDto[] = []
  const number = (name: string) => Number(values[name])
  const text = (name: string) => String(values[name] ?? '')
  if (type === 'daily-prices' || type === 'history') {
    const [open, high, low, close] = ['open', 'high', 'low', 'close'].map(number)
    if (high < Math.max(open, close, low) || low > Math.min(open, close)) {
      issues.push(
        error(
          'inconsistentPrices',
          'high',
          'The high is below the open or the close, or the low above them.',
        ),
      )
    }
  }
  if (type === 'auctions') {
    const security = auctionSecurity(text('security'))
    if (security) values.security = auctionSecurityLabel(security.instrument, security.term)
    else issues.push(unknownValue('security', text('security')))
    if (number('allotted') > number('bids') || number('allotted') > number('offered') * 1.5) {
      issues.push(
        error(
          'inconsistentAmounts',
          'allotted',
          'More allotted than bid, or than offered with its margin.',
        ),
      )
    }
  }
  if (type === 'curves') {
    const years = curveYears(text('maturity'))
    if (years === null) issues.push(unknownValue('maturity', text('maturity')))
    else values.maturity = text('maturity').trim().toUpperCase()
  }
  if (type === 'corporate-actions') {
    const action = text('type').toLowerCase()
    if (ACTION_TYPES.some((candidate) => candidate === action)) values.type = action
    else issues.push(unknownValue('type', text('type')))
    if (text('pay_date') < text('ex_date')) {
      issues.push(error('inconsistentDates', 'pay_date', 'The payment comes before the ex-date.'))
    }
  }
  if (type === 'securities') {
    const kind = text('type').toLowerCase()
    if (SECURITY_TYPES.some((candidate) => candidate === kind)) values.type = kind
    else issues.push(unknownValue('type', text('type')))
    if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(text('isin')))
      issues.push(unknownValue('isin', text('isin')))
    if (!/^[A-Z]{3}$/.test(text('currency')))
      issues.push(unknownValue('currency', text('currency')))
  }
  if (type === 'financial-statements' && !LINE_ITEMS.some((key) => key === values.line_item)) {
    issues.push(unknownValue('line_item', text('line_item')))
  }
  return issues
}

/** Where a row's data lives in the database: the same key in two rows is a duplicate. */
export function rowKey(type: ImportType, values: ImportValues): string {
  const part = (name: string) => String(values[name] ?? '')
  switch (type) {
    case 'daily-prices':
    case 'history':
      return `${part('code')}|${part('date')}`
    case 'indices':
      return `${part('index')}|${part('date')}`
    case 'corporate-actions':
      return `${part('code')}|${part('type')}|${part('ex_date')}`
    case 'auctions':
      return `${part('date')}|${part('country')}|${part('security')}`
    case 'curves':
      return `${part('date')}|${part('country')}|${part('maturity')}`
    case 'financial-statements':
      return `${part('code')}|${part('fiscal_year')}|${part('line_item')}`
    case 'securities':
      return part('code')
  }
}

/** Columns stored in the database, compared to tell a changed row from an unchanged one. */
export const STORED_COLUMNS: Record<ImportType, readonly string[]> = {
  'daily-prices': ['open', 'high', 'low', 'close', 'volume'],
  history: ['open', 'high', 'low', 'close', 'volume'],
  indices: ['value'],
  'corporate-actions': ['pay_date', 'amount'],
  auctions: ['offered', 'bids', 'allotted', 'avg_rate', 'marginal_rate'],
  curves: ['rate'],
  'financial-statements': ['value'],
  securities: ['isin', 'name', 'type', 'sector', 'country', 'shares', 'currency'],
}

/** What the checks need from the database. */
export interface ImportContext {
  sessionDate: string
  isSession: (day: string) => boolean
  isSecurity: (code: string) => boolean
  isIndex: (code: string) => boolean
  /** The stored values for a row's key, if any. */
  stored: (key: string, values: ImportValues) => ImportValues | undefined
  /** The figure a change is measured from: the previous close, the previous auction's rate... */
  previous: (values: ImportValues) => number | undefined
}

const CHANGED_FIELD: Partial<Record<ImportType, string>> = {
  'daily-prices': 'close',
  history: 'close',
  indices: 'value',
  auctions: 'avg_rate',
  curves: 'rate',
}

const FIELD_LABEL: Record<string, string> = {
  close: 'Close',
  value: 'Value',
  avg_rate: 'Rate',
  rate: 'Rate',
}

function signed(value: number, decimals: number): string {
  return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(decimals)}`
}

/** The business checks of a row whose cells were read (spec section 11). */
function businessIssues(
  definition: ImportTypeDto,
  values: ImportValues,
  context: ImportContext,
): ImportIssueDto[] {
  const { type, checks, changeThreshold } = definition
  const issues: ImportIssueDto[] = []
  const code = String(values.code ?? '')
  if (checks.includes('unknownSecurity') && !context.isSecurity(code)) {
    issues.push(error('unknownSecurity', 'code', `Unknown security ${code}.`, { code }))
  }
  const index = String(values.index ?? '')
  if (checks.includes('unknownIndex') && !context.isIndex(index)) {
    issues.push(error('unknownIndex', 'index', `Unknown index ${index}.`, { code: index }))
  }
  if (checks.includes('unknownCountry')) {
    const country = countryCode(String(values.country ?? ''))
    if (country) values.country = country
    else {
      const text = String(values.country ?? '')
      issues.push(error('unknownCountry', 'country', `Unknown country ${text}.`, { text }))
    }
  }
  const date = typeof values.date === 'string' ? values.date : null
  if (date && checks.includes('notASession') && !context.isSession(date)) {
    issues.push(error('notASession', 'date', `${date} is not a session day.`, { date }))
  } else if (date && checks.includes('otherSession') && date !== context.sessionDate) {
    issues.push(
      error('otherSession', 'date', `Dated ${date}, not ${context.sessionDate}.`, {
        date,
        session: context.sessionDate,
      }),
    )
  }
  if (issues.length > 0) return issues

  const field = CHANGED_FIELD[type]
  const previous = field ? context.previous(values) : undefined
  if (field && changeThreshold && previous !== undefined && previous !== 0) {
    const value = Number(values[field])
    const change = changeThreshold.unit === 'pct' ? (value / previous - 1) * 100 : value - previous
    if (Math.abs(change) > changeThreshold.value) {
      const unit = changeThreshold.unit === 'pct' ? '%' : ' pt'
      const threshold =
        changeThreshold.unit === 'pct'
          ? `${changeThreshold.value}%`
          : changeThreshold.value.toFixed(2)
      issues.push(
        issue(
          'changeAboveThreshold',
          'alert',
          field,
          `${FIELD_LABEL[field]} ${signed(change, 2)}${unit} vs previous (threshold ${threshold})`,
          {
            field,
            change: Number(change.toFixed(2)),
            unit: changeThreshold.unit,
            threshold: changeThreshold.value,
            previous,
          },
        ),
      )
    }
  }
  if (
    checks.includes('zeroVolumeChanged') &&
    values.volume === 0 &&
    previous !== undefined &&
    values.close !== previous
  ) {
    issues.push(
      issue(
        'zeroVolumeChanged',
        'alert',
        'volume',
        `No volume, but the close moved from ${previous}.`,
        { previous },
      ),
    )
  }
  return issues
}

export interface CheckedRow {
  line: number
  values: ImportValues
  issues: ImportIssueDto[]
  /** Stored values for the row's key; null when the row is new or in error. */
  stored: ImportValues | null
  diff: 'new' | 'changed' | 'unchanged' | null
}

function sameValue(a: ImportValues[string], b: ImportValues[string]): boolean {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-9
  return (a ?? null) === (b ?? null)
}

export function changedColumns(
  type: ImportType,
  values: ImportValues,
  stored: ImportValues,
): string[] {
  return STORED_COLUMNS[type].filter(
    (name) => name in stored && !sameValue(values[name], stored[name]),
  )
}

/**
 * The checks of an uploaded file: the format of each cell, duplicates within the file, the
 * business rules, then the difference with the database.
 */
export function checkRows(
  definition: ImportTypeDto,
  rows: readonly { line: number; cells: Readonly<Record<string, Cell>> }[],
  context: ImportContext,
): CheckedRow[] {
  const firstLine = new Map<string, number>()
  return rows.map(({ line, cells }) => {
    const { values, issues } = readValues(definition, cells)
    if (issues.length === 0) issues.push(...businessIssues(definition, values, context))
    const key = rowKey(definition.type, values)
    const first = firstLine.get(key)
    if (issues.every((found) => found.severity !== 'error')) {
      if (first === undefined) firstLine.set(key, line)
      else {
        issues.unshift(error('duplicate', null, `Same data as line ${first}.`, { line: first }))
      }
    }
    if (issues.some((found) => found.severity === 'error')) {
      return { line, values, issues, stored: null, diff: null }
    }
    const stored = context.stored(key, values) ?? null
    const diff = !stored
      ? 'new'
      : changedColumns(definition.type, values, stored).length > 0
        ? 'changed'
        : 'unchanged'
    return { line, values, issues, stored, diff }
  })
}

export function rowStatus(row: Pick<CheckedRow, 'issues' | 'diff'>): ImportRowStatus {
  if (row.issues.some((found) => found.severity === 'error')) return 'error'
  if (row.issues.some((found) => found.severity === 'alert')) return 'alert'
  return row.diff ?? 'new'
}

export function countRows(rows: readonly (CheckedRow & { checked: boolean })[]): ImportCountsDto {
  const counts: ImportCountsDto = {
    read: rows.length,
    new: 0,
    changed: 0,
    unchanged: 0,
    alerts: 0,
    alertsChecked: 0,
    errors: 0,
  }
  for (const row of rows) {
    const status = rowStatus(row)
    if (status === 'error') {
      counts.errors += 1
      continue
    }
    if (status === 'alert') {
      counts.alerts += 1
      if (row.checked) counts.alertsChecked += 1
    }
    if (row.diff) counts[row.diff] += 1
  }
  return counts
}

/** Publish stays disabled while an error remains or an alert is not ticked "checked". */
export function canPublish(counts: ImportCountsDto): boolean {
  return counts.read > 0 && counts.errors === 0 && counts.alertsChecked === counts.alerts
}
