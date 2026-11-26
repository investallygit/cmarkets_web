import type {
  RfqCriteriaDto,
  RfqEligibleQuery,
  RfqInstrument,
  RfqSecurityRefDto,
} from '@/shared/api/contracts'

/** A request by criteria as the form holds it: an empty field imposes nothing. */
export interface CriteriaDraft {
  minYield: number | null
  maxMaturityYears: number | null
  /** The issuing states' codes ("CM"); none: the six. */
  countries: string[]
  /** None, or both: either kind. */
  securityTypes: RfqInstrument[]
}

/** The three-letter codes screen 22 writes the CEMAC states with ("CMR, GAB, COG"). */
const CODES3: Readonly<Record<string, string>> = {
  CM: 'CMR',
  GA: 'GAB',
  CG: 'COG',
  TD: 'TCD',
  CF: 'CAF',
  GQ: 'GNQ',
}

/** "CMR" for "CM"; another state's code as it comes. */
export function countryCode3(code: string): string {
  return CODES3[code.toUpperCase()] ?? code
}

/**
 * The question GET /rfq/eligible-securities is asked for a draft at a settlement date: the
 * criteria entered only, both kinds asked as none.
 */
export function criteriaQuery(draft: CriteriaDraft, settlementDate: string): RfqEligibleQuery {
  const types = draft.securityTypes.length === 1 ? draft.securityTypes : []
  return {
    settlementDate,
    ...(draft.minYield !== null ? { minYield: draft.minYield } : {}),
    ...(draft.maxMaturityYears !== null ? { maxMaturityYears: draft.maxMaturityYears } : {}),
    ...(draft.countries.length > 0 ? { countries: [...draft.countries].sort() } : {}),
    ...(types.length > 0 ? { securityTypes: types } : {}),
  }
}

/** What the answer form shows under itself: each criterion met (true), broken (false) or none. */
export interface CriteriaChecks {
  yield: boolean | null
  maturity: boolean | null
  country: boolean | null
}

/**
 * The checks of an offer against a request's criteria, as CMarket.Api makes them (screen 22:
 * "the yield falls below the minimum, the remaining maturity exceeds the maximum or the country is
 * not accepted"); a yield not worked out yet checks nothing.
 */
export function criteriaChecks(
  criteria: RfqCriteriaDto,
  offered: { security: RfqSecurityRefDto; remainingYears: number },
  yieldPct: number | null,
): CriteriaChecks {
  return {
    yield: criteria.minYield === null || yieldPct === null ? null : yieldPct >= criteria.minYield,
    maturity:
      criteria.maxMaturityYears === null
        ? null
        : offered.remainingYears <= criteria.maxMaturityYears,
    country:
      criteria.countries.length === 0
        ? null
        : criteria.countries.includes(offered.security.country),
  }
}
