import type {
  EtfAssetClass,
  EtfGeography,
  EtfScreenCriteriaDto,
  EtfScreenerQuery,
  EtfSector,
} from '@/shared/api/contracts'

/** The panel's criteria (spec, screen 15): one value a drop-down (null for "All"), the geographies a list, the boxes. */
export interface EtfCriteria {
  assetClass: EtfAssetClass | null
  subCategory: string | null
  geographies: EtfGeography[]
  sector: EtfSector | null
  /** The issuer, by name. */
  provider: string | null
  /** The listing exchange's code. */
  exchange: string | null
  /** Returns above it this year, in percent. */
  ytdMin: number | null
  sharpeMin: number | null
  /** Fees below it, in percent a year. */
  terMax: number | null
  ucitsOnly: boolean
  accumulatingOnly: boolean
  hedgedOnly: boolean
}

/** The choices of the drop-downs: the mockup's "> 8%", "> 1.0" and "< 0.25%" among them. */
export const YTD_CHOICES = [0, 5, 8, 10, 15, 20] as const
export const SHARPE_CHOICES = [0, 0.5, 1, 1.5, 2] as const
export const TER_CHOICES = [0.1, 0.15, 0.2, 0.25, 0.5, 1] as const

/**
 * The screen of the mockup: equities, global or US, UCITS only, a YTD above 8%, a Sharpe ratio
 * above 1.0 and fees below 0.25%.
 */
export function defaultCriteria(): EtfCriteria {
  return {
    assetClass: 'equity',
    subCategory: null,
    geographies: ['global', 'us'],
    sector: null,
    provider: null,
    exchange: null,
    ytdMin: 8,
    sharpeMin: 1,
    terMax: 0.25,
    ucitsOnly: true,
    accumulatingOnly: false,
    hedgedOnly: false,
  }
}

/** GET /etfs's query: the criteria set, every ETF on one page. */
export function toQuery(criteria: EtfCriteria): EtfScreenerQuery {
  const query: EtfScreenerQuery = { pageSize: 200 }
  if (criteria.assetClass) query.assetClass = criteria.assetClass
  if (criteria.subCategory) query.subCategory = criteria.subCategory
  if (criteria.geographies.length > 0) query.geography = criteria.geographies.join(',')
  if (criteria.sector) query.sector = criteria.sector
  if (criteria.provider) query.provider = criteria.provider
  if (criteria.exchange) query.exchange = criteria.exchange
  if (criteria.ucitsOnly) query.ucits = true
  if (criteria.accumulatingOnly) query.distribution = 'accumulating'
  if (criteria.hedgedOnly) query.hedged = true
  if (criteria.terMax !== null) query.terMax = criteria.terMax
  if (criteria.ytdMin !== null) query.ytdMin = criteria.ytdMin
  if (criteria.sharpeMin !== null) query.sharpeMin = criteria.sharpeMin
  return query
}

const list = <T>(value: T | null): T[] => (value === null ? [] : [value])

/** The criteria as a saved screen keeps them (POST /analysis/etf-screens). */
export function toSaved(criteria: EtfCriteria): EtfScreenCriteriaDto {
  return {
    assetClasses: list(criteria.assetClass),
    subCategories: list(criteria.subCategory),
    geographies: [...criteria.geographies],
    sectors: list(criteria.sector),
    providers: list(criteria.provider),
    exchanges: list(criteria.exchange),
    ytdMin: criteria.ytdMin,
    sharpeMin: criteria.sharpeMin,
    terMax: criteria.terMax,
    ucitsOnly: criteria.ucitsOnly,
    accumulatingOnly: criteria.accumulatingOnly,
    hedgedOnly: criteria.hedgedOnly,
  }
}

/** A saved screen back in the panel: the first value of a list a drop-down shows. */
export function fromSaved(saved: EtfScreenCriteriaDto): EtfCriteria {
  return {
    assetClass: saved.assetClasses[0] ?? null,
    subCategory: saved.subCategories[0] ?? null,
    geographies: [...saved.geographies],
    sector: saved.sectors[0] ?? null,
    provider: saved.providers[0] ?? null,
    exchange: saved.exchanges[0] ?? null,
    ytdMin: saved.ytdMin,
    sharpeMin: saved.sharpeMin,
    terMax: saved.terMax,
    ucitsOnly: saved.ucitsOnly,
    accumulatingOnly: saved.accumulatingOnly,
    hedgedOnly: saved.hedgedOnly,
  }
}
