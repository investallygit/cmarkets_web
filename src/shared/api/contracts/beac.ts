/**
 * BEAC, the BEAC's monetary policy and the CEMAC's liquidity (screen 34, sixth version; ROADMAP
 * step 65). CMarket.Api's Features/Beac/BeacDtos.cs. `illustrative` says that what is shown is the
 * demo's history, which no upload of the Data admin wrote (ROADMAP decision 59).
 */

/** A meeting's corridor, in percent: the policy rate (TIAO) between the two facilities. */
export interface BeacRatesDto {
  policy: number
  marginalLending: number
  deposit: number
}

/** The reserve requirements, in percent of sight and of term deposits. */
export interface BeacReservesDto {
  sight: number
  term: number
}

export type MonetaryIndicator =
  'm2' | 'credit' | 'fx_reserves' | 'external_coverage' | 'inflation' | 'gdp_growth'

/** A figure: its value, its period (a month's first day, or a year's) and whether it is the year's. */
export interface MonetaryFigureDto {
  indicator: MonetaryIndicator
  value: number
  period: string
  yearly: boolean
}

/** GET /beac/summary. */
export interface BeacSummaryDto {
  rates: BeacRatesDto | null
  reserves: BeacReservesDto | null
  ratesAsOf: string | null
  inflation: MonetaryFigureDto | null
  nextMeeting: string | null
  illustrative: boolean
}

/** A step of the corridor: the rates in force from its day. */
export interface BeacRatePointDto extends BeacRatesDto {
  date: string
}

/** GET /beac/rates/history?from=: the steps, the rates in force on `from` first. */
export interface BeacRateHistoryDto {
  from: string
  points: BeacRatePointDto[]
  illustrative: boolean
}

/** GET /beac/decisions: a meeting; no rates for one announced. */
export interface BeacDecisionDto {
  id: string
  date: string
  rates: BeacRatesDto | null
  reserves: BeacReservesDto | null
  /** The policy rate's change from the meeting before, in basis points. */
  changeBp: number | null
  releaseUrl: string | null
  /** A document of the library: /documents/{id}/file. */
  releaseDocumentId: string | null
  summary: string | null
  illustrative: boolean
}

export type BeacOperationKind = 'injection' | 'absorption'

/** A tender: its amounts in billions of XAF, its rate in percent. */
export interface BeacOperationDto {
  id: string
  date: string
  kind: BeacOperationKind
  termDays: number
  offered: number
  bid: number
  allotted: number
  rate: number
}

/** GET /beac/operations: the latest tenders, newest first. */
export interface BeacOperationsDto {
  items: BeacOperationDto[]
  illustrative: boolean
}

export type InterbankTenor = 'overnight' | '1w' | '1m' | '3m'

/** A tenor's average rate of the week and its change from the week before, in basis points. */
export interface InterbankRateDto {
  tenor: InterbankTenor
  rate: number | null
  changeBp: number | null
}

/** GET /beac/interbank: the latest week; no week before a first file. */
export interface BeacInterbankDto {
  weekStart: string | null
  weekEnd: string | null
  rates: InterbankRateDto[]
  /** Billions of XAF. */
  volume: number | null
  volumeChangePct: number | null
  illustrative: boolean
}

/** GET /beac/aggregates: each indicator's latest figure, in the screen's order. */
export interface BeacAggregatesDto {
  items: MonetaryFigureDto[]
  illustrative: boolean
}
