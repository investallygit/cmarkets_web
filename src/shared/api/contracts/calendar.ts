import type { IsoDate, IsoDateTime } from './common'

/**
 * CAL, the event calendar (screen 32, sixth version; ROADMAP step 67, decision 57). CMarket.Api's
 * Features/Calendar/Common/CalendarDtos.cs. The nine types of the spec; the days the BVMAC is
 * closed are notes on their day, no longer a type.
 */
export type CalendarEventType =
  | 'auction'
  | 'result'
  | 'redemption'
  | 'dividend'
  | 'meeting'
  | 'earnings'
  | 'beac'
  | 'statistic'
  | 'international'

/** What the agenda shows beside an event; amounts in XAF, or in the dividend's currency. */
export interface CalendarFactsDto {
  instrument: 'bta' | 'ota' | null
  /** Weeks for a BTA, years for an OTA. */
  term: number | null
  /** ex or payment for a dividend, partial or final for a redemption. */
  phase: 'ex' | 'payment' | 'partial' | 'final' | null
  offered: number | null
  valueDate: IsoDate | null
  maturity: IsoDate | null
  /** A result's auction day. */
  auctionDate: IsoDate | null
  averageRate: number | null
  coverPct: number | null
  /** A dividend's amount a share, or the principal a redemption repays. */
  amount: number | null
  currency: string | null
  /** The rate a meeting decided, or the one in force before a meeting announced. */
  policyRate: number | null
  /** The Data admin's or EODHD's detail: "Agenda: capital increase". */
  note: string | null
}

/** An event of CAL, MKT's calendar panel and the calendar alerts. */
export interface CalendarEventDto {
  id: string
  date: IsoDate
  /** "10:00" in Douala; null for an event of the whole day. */
  time: string | null
  type: CalendarEventType
  /** As entered or loaded; the screen words the others from their facts. */
  title: string
  securityId: string | null
  securityCode: string | null
  /** A state's two letters; null for the whole zone (the BEAC's, the CEMAC's). */
  country: string | null
  facts: CalendarFactsDto
  /** A date entered by hand, not yet confirmed. */
  announced: boolean
  /** The demo's, as the mockup's "(example)". */
  example: boolean
}

/** A day the BVMAC is closed or keeps other hours. */
export interface CalendarNoteDto {
  date: IsoDate
  text: string
  closed: boolean
}

/** GET /calendar?from=&to=&types=&countries=&mine= */
export interface CalendarDto {
  from: IsoDate
  to: IsoDate
  events: CalendarEventDto[]
  notes: CalendarNoteDto[]
  /** Per type, the countries and "only my securities" applied, the types not. */
  counts: { type: CalendarEventType; count: number }[]
  /** False while ADMCFG keeps EODHD's international events off. */
  internationalShown: boolean
}

/** GET /calendar/{id}: an event and what its detail adds. */
export interface CalendarEventDetailDto {
  event: CalendarEventDto
  issuer: string | null
  securityName: string | null
  /** The auction before of the same state, instrument and term. */
  previous: { date: IsoDate; averageRate: number; coverPct: number } | null
  marginalRate: number | null
  bidders: number | null
  exDate: IsoDate | null
  paymentDate: IsoDate | null
  source: 'file' | 'entry' | 'eodhd' | 'cmarket'
}

/** The types the Data admin enters in CORR; the others come from their own data. */
export type CalendarEntryType =
  'auction' | 'meeting' | 'earnings' | 'beac' | 'statistic' | 'international'

/** GET /data/calendar: an event entered or loaded, as CORR lists it. */
export interface CalendarEntryDto {
  id: string
  date: IsoDate
  time: string | null
  type: CalendarEntryType
  title: string
  detail: string | null
  securityId: string | null
  country: string | null
  confirmed: boolean
  source: 'file' | 'entry' | 'eodhd'
  updatedAt: IsoDateTime
}

/** POST /data/calendar, PUT /data/calendar/{id}. */
export interface CalendarEntryInputDto {
  date: IsoDate
  /** "10:00"; null for the whole day. */
  time: string | null
  type: CalendarEntryType
  title: string
  detail: string | null
  securityId: string | null
  country: string | null
  confirmed: boolean
}
