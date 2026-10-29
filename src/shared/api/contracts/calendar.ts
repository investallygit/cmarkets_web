import type { IsoDate } from './common'

export type CalendarEventType =
  'session' | 'auction' | 'dividend' | 'meeting' | 'maturity' | 'earnings'

/** GET /calendar?from=&to=&type= */
export interface CalendarEventDto {
  id: string
  date: IsoDate
  type: CalendarEventType
  title: string
  securityId: string | null
  country: string | null
}
