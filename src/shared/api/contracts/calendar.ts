import type { IsoDate } from './common'

export type CalendarEventType =
  'session' | 'auction' | 'dividend' | 'meeting' | 'maturity' | 'earnings'

/**
 * GET /calendar?from=&to=&type=&country=, oldest first. `type` may be repeated; a country also
 * keeps the regional events (BVMAC sessions), whose country is null.
 */
export interface CalendarEventDto {
  id: string
  date: IsoDate
  type: CalendarEventType
  title: string
  securityId: string | null
  country: string | null
}
