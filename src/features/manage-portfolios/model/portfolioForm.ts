import { NO_LIMITS, PORTFOLIO_LIMITS } from '@/entities/portfolio'
import type {
  PortfolioCreateDto,
  PortfolioDto,
  PortfolioKind,
  PortfolioLimit,
  PortfolioLimitsDto,
  PortfolioUpdateDto,
} from '@/shared/api/contracts'

export const MAX_NAME_LENGTH = 40
export const DEFAULT_BENCHMARK = 'BVMAC-A'
/** A Student's simulated portfolio starts with this much, in the portfolio currency. */
const DEFAULT_NOTIONAL = 100_000_000

export interface ModelLineState {
  /** Stable key of the row while the user edits the list. */
  key: string
  security: { id: string; code: string } | null
  weightPct: number | null
}

export interface PortfolioFormState {
  name: string
  kind: PortfolioKind
  currency: string
  benchmark: string
  limits: PortfolioLimitsDto
  notional: number | null
  startDate: string | null
  lines: ModelLineState[]
  /** Read by the members of the user's organisation. */
  shared: boolean
}

export type PortfolioFormError =
  'required' | 'positive' | 'percent' | 'future' | 'duplicate' | 'noLine' | 'overAllocated'

export interface PortfolioFormErrors {
  name?: PortfolioFormError
  limits?: Partial<Record<PortfolioLimit, PortfolioFormError>>
  notional?: PortfolioFormError
  startDate?: PortfolioFormError
  /** The list as a whole: no line, or more than 100%. */
  lines?: PortfolioFormError
  line?: Record<string, { security?: PortfolioFormError; weightPct?: PortfolioFormError }>
}

let lineCount = 0
export function newLine(security: ModelLineState['security'] = null): ModelLineState {
  lineCount += 1
  return { key: `line-${lineCount}`, security, weightPct: null }
}

/**
 * A new portfolio, or the settings of an existing one. A Student starts on a model portfolio, the
 * only kind the account may hold.
 */
export function initialPortfolioForm(
  editing: PortfolioDto | null,
  modelOnly: boolean,
  today: string,
  codeOf: (securityId: string) => string,
): PortfolioFormState {
  if (editing) {
    return {
      name: editing.name,
      kind: editing.kind,
      currency: editing.currency,
      benchmark: editing.benchmark,
      limits: { ...editing.limits },
      notional: editing.model?.notional ?? DEFAULT_NOTIONAL,
      startDate: editing.model?.startDate ?? today,
      lines:
        editing.model?.lines.map((line) => ({
          ...newLine({ id: line.securityId, code: codeOf(line.securityId) }),
          weightPct: line.weightPct,
        })) ?? [],
      shared: editing.sharedWithOrganization,
    }
  }
  return {
    name: '',
    kind: modelOnly ? 'model' : 'real',
    currency: 'XAF',
    benchmark: DEFAULT_BENCHMARK,
    limits: { ...NO_LIMITS },
    notional: DEFAULT_NOTIONAL,
    startDate: today,
    lines: [newLine()],
    shared: false,
  }
}

/** Weight left in cash, in percent. */
export function cashWeight(form: PortfolioFormState): number {
  return 100 - form.lines.reduce((sum, line) => sum + (line.weightPct ?? 0), 0)
}

export function validatePortfolioForm(
  form: PortfolioFormState,
  today: string,
): PortfolioFormErrors {
  const errors: PortfolioFormErrors = {}
  if (form.name.trim() === '') errors.name = 'required'
  const limits: Partial<Record<PortfolioLimit, PortfolioFormError>> = {}
  for (const key of PORTFOLIO_LIMITS) {
    const value = form.limits[key]
    if (value === null) continue
    if (value <= 0) limits[key] = 'positive'
    else if ((key === 'issuerWeightPct' || key === 'drawdownPct') && value > 100)
      limits[key] = 'percent'
  }
  if (Object.keys(limits).length > 0) errors.limits = limits
  if (form.kind !== 'model') return errors

  if (form.notional === null) errors.notional = 'required'
  else if (form.notional <= 0) errors.notional = 'positive'
  if (!form.startDate) errors.startDate = 'required'
  else if (form.startDate > today) errors.startDate = 'future'
  if (form.lines.length === 0) errors.lines = 'noLine'
  else if (cashWeight(form) < -1e-9) errors.lines = 'overAllocated'
  const seen = new Set<string>()
  const line: NonNullable<PortfolioFormErrors['line']> = {}
  for (const row of form.lines) {
    const rowErrors: { security?: PortfolioFormError; weightPct?: PortfolioFormError } = {}
    if (!row.security) rowErrors.security = 'required'
    else if (seen.has(row.security.id)) rowErrors.security = 'duplicate'
    if (row.security) seen.add(row.security.id)
    if (row.weightPct === null) rowErrors.weightPct = 'required'
    else if (row.weightPct <= 0) rowErrors.weightPct = 'positive'
    else if (row.weightPct > 100) rowErrors.weightPct = 'percent'
    if (Object.keys(rowErrors).length > 0) line[row.key] = rowErrors
  }
  if (Object.keys(line).length > 0) errors.line = line
  return errors
}

export function hasErrors(errors: PortfolioFormErrors): boolean {
  return Object.keys(errors).length > 0
}

/** Shared only by a member of an organisation, who sees the choice. */
function settingsOf(form: PortfolioFormState, inOrganization: boolean) {
  return {
    name: form.name.trim(),
    benchmark: form.benchmark,
    limits: { ...form.limits },
    model:
      form.kind === 'model'
        ? {
            notional: form.notional ?? 0,
            startDate: form.startDate ?? '',
            lines: form.lines.map((line) => ({
              securityId: line.security?.id ?? '',
              weightPct: line.weightPct ?? 0,
            })),
          }
        : null,
    sharedWithOrganization: inOrganization && form.shared,
  }
}

/** POST /portfolios; call it on a form without errors. */
export function toCreateInput(
  form: PortfolioFormState,
  inOrganization: boolean,
): PortfolioCreateDto {
  return { ...settingsOf(form, inOrganization), kind: form.kind, currency: form.currency }
}

/** PUT /portfolios/{id}, with the version the settings were read at. */
export function toUpdateInput(
  form: PortfolioFormState,
  version: string,
  inOrganization: boolean,
): PortfolioUpdateDto {
  return { ...settingsOf(form, inOrganization), version }
}
