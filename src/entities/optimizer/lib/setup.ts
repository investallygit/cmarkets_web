import type {
  OptAssetClass,
  OptCorrelationDto,
  OptFrequency,
  OptGroupConstraintDto,
  OptGroupScope,
  OptHistory,
  OptObjective,
  OptSetupDto,
  OptUniverseItemDto,
} from '@/shared/api/contracts'

/** Securities an optimisation holds (spec screen 28). */
export const OPT_MIN_SECURITIES = 2
export const OPT_MAX_SECURITIES = 20

export const OPT_OBJECTIVES: readonly OptObjective[] = [
  'minRiskForReturn',
  'maxReturnForRisk',
  'maxSharpe',
  'minRisk',
]
export const OPT_HISTORIES: readonly OptHistory[] = ['1y', '3y', '5y']
export const OPT_FREQUENCIES: readonly OptFrequency[] = ['weekly', 'daily']
export const OPT_ASSET_CLASSES: readonly OptAssetClass[] = ['equity', 'bond', 'etf']
export const OPT_GROUP_SCOPES: readonly OptGroupScope[] = ['assetClass', 'country', 'currency']

/** Whether the objective reads a target: A's minimum return, B's maximum volatility. */
export const hasTarget = (objective: OptObjective) =>
  objective === 'minRiskForReturn' || objective === 'maxReturnForRisk'

/** The screen 28 mockup's settings: A at 8%, 25% a security, XAF 1 bn, 3 years of weekly returns. */
export function emptySetup(): OptSetupDto {
  return {
    universe: [],
    objective: 'minRiskForReturn',
    targetPct: 8,
    maxWeightPct: 25,
    groups: [],
    correlations: [],
    capital: 1_000_000_000,
    history: '3y',
    frequency: 'weekly',
    riskFreeRatePct: null,
    comparePortfolioId: null,
  }
}

const sameId = (a: string, b: string) => a.toUpperCase() === b.toUpperCase()

/** Adds the securities not in the universe yet, up to 20. */
export function addSecurities(setup: OptSetupDto, securityIds: readonly string[]): OptSetupDto {
  const universe = [...setup.universe]
  for (const id of securityIds) {
    if (universe.length >= OPT_MAX_SECURITIES) break
    if (universe.some((item) => sameId(item.securityId, id))) continue
    universe.push({
      securityId: id,
      expectedReturnPct: null,
      volatilityPct: null,
      minWeightPct: null,
      maxWeightPct: null,
    })
  }
  return { ...setup, universe }
}

/** The security and every correlation entered with it. */
export function removeSecurity(setup: OptSetupDto, securityId: string): OptSetupDto {
  return {
    ...setup,
    universe: setup.universe.filter((item) => !sameId(item.securityId, securityId)),
    correlations: setup.correlations.filter(
      (entry) => !sameId(entry.a, securityId) && !sameId(entry.b, securityId),
    ),
  }
}

export function updateItem(
  setup: OptSetupDto,
  securityId: string,
  patch: Partial<Omit<OptUniverseItemDto, 'securityId'>>,
): OptSetupDto {
  return {
    ...setup,
    universe: setup.universe.map((item) =>
      sameId(item.securityId, securityId) ? { ...item, ...patch } : item,
    ),
  }
}

/** The correlation entered between two securities; null takes the estimate back. */
export function setCorrelation(
  setup: OptSetupDto,
  a: string,
  b: string,
  value: number | null,
): OptSetupDto {
  const others = setup.correlations.filter(
    (entry) =>
      !(sameId(entry.a, a) && sameId(entry.b, b)) && !(sameId(entry.a, b) && sameId(entry.b, a)),
  )
  return {
    ...setup,
    correlations: value === null ? others : [...others, { a, b, value: clampCorrelation(value) }],
  }
}

export function enteredCorrelation(
  correlations: readonly OptCorrelationDto[],
  a: string,
  b: string,
): number | null {
  const found = correlations.find(
    (entry) =>
      (sameId(entry.a, a) && sameId(entry.b, b)) || (sameId(entry.a, b) && sameId(entry.b, a)),
  )
  return found ? found.value : null
}

const clampCorrelation = (value: number) => Math.max(-1, Math.min(1, Math.round(value * 100) / 100))

/** A group's limit; both null take the group off. */
export function setGroup(
  setup: OptSetupDto,
  scope: OptGroupScope,
  key: string,
  limits: Pick<OptGroupConstraintDto, 'minPct' | 'maxPct'>,
): OptSetupDto {
  const others = setup.groups.filter((group) => !(group.scope === scope && group.key === key))
  const keep = limits.minPct !== null || limits.maxPct !== null
  const index = setup.groups.findIndex((group) => group.scope === scope && group.key === key)
  if (!keep) return { ...setup, groups: others }
  const next = { scope, key, ...limits }
  if (index < 0) return { ...setup, groups: [...setup.groups, next] }
  return { ...setup, groups: setup.groups.map((group, at) => (at === index ? next : group)) }
}

/**
 * The constraints the setup sets, as the result counts them: A's or B's target, the maximum of
 * every security, each one's own bounds, each group's.
 */
export function constraintCount(setup: OptSetupDto): number {
  return (
    (hasTarget(setup.objective) ? 1 : 0) +
    (setup.maxWeightPct !== null ? 1 : 0) +
    setup.universe.reduce(
      (sum, item) =>
        sum + ((item.minWeightPct ?? 0) > 0 ? 1 : 0) + (item.maxWeightPct !== null ? 1 : 0),
      0,
    ) +
    setup.groups.reduce(
      (sum, group) => sum + ((group.minPct ?? 0) > 0 ? 1 : 0) + (group.maxPct !== null ? 1 : 0),
      0,
    )
  )
}

/** Enough securities, the target the objective needs, a capital: the check may run. */
export function isCheckable(setup: OptSetupDto): boolean {
  return (
    setup.universe.length >= OPT_MIN_SECURITIES &&
    setup.universe.length <= OPT_MAX_SECURITIES &&
    setup.capital > 0 &&
    (!hasTarget(setup.objective) || setup.targetPct !== null)
  )
}

/** The short code of a security in the correlation grid's headers: "SEMC", "SAFA", "ECMR". */
export function shortCode(code: string): string {
  const word = code.split(/[\s.-]/)[0] ?? code
  return word.slice(0, 4).toUpperCase()
}
