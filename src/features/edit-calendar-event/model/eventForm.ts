import type {
  CalendarEntryDto,
  CalendarEntryInputDto,
  CalendarEntryType,
} from '@/shared/api/contracts'

/** The types the Data admin enters in CORR, in CAL's order. */
export const ENTRY_TYPES: readonly CalendarEntryType[] = [
  'auction',
  'meeting',
  'earnings',
  'beac',
  'statistic',
  'international',
]

/** The form of an event: what CORR types. */
export interface EventForm {
  date: string | null
  /** "10:00", or empty for the whole day. */
  time: string
  type: CalendarEntryType
  title: string
  detail: string
  security: { id: string; code: string } | null
  /** Two letters, or empty for the zone or a security's state. */
  country: string
  confirmed: boolean
}

const TIME = /^([01]?\d|2[0-3])[:h]([0-5]\d)$/

export function eventForm(entry: CalendarEntryDto | null, today: string): EventForm {
  return entry
    ? {
        date: entry.date,
        time: entry.time ?? '',
        type: entry.type,
        title: entry.title,
        detail: entry.detail ?? '',
        security: entry.securityId ? { id: entry.securityId, code: entry.securityId } : null,
        country: entry.country ?? '',
        confirmed: entry.confirmed,
      }
    : {
        date: today,
        time: '',
        type: 'statistic',
        title: '',
        detail: '',
        security: null,
        country: '',
        // A date entered by hand is announced until confirmed (decision 57).
        confirmed: false,
      }
}

/** What the form misses, and the body of POST or PUT /data/calendar once nothing does. */
export function eventInput(form: EventForm): {
  missing: (keyof EventForm)[]
  input: CalendarEntryInputDto | null
} {
  const missing: (keyof EventForm)[] = []
  if (!form.date) missing.push('date')
  if (!form.title.trim()) missing.push('title')
  const time = form.time.trim()
  const match = TIME.exec(time)
  if (time && !match) missing.push('time')
  if (missing.length > 0 || !form.date) return { missing, input: null }
  return {
    missing,
    input: {
      date: form.date,
      time: match ? `${match[1].padStart(2, '0')}:${match[2]}` : null,
      type: form.type,
      title: form.title.trim(),
      detail: form.detail.trim() || null,
      securityId: form.security?.id ?? null,
      country: form.country || null,
      confirmed: form.confirmed,
    },
  }
}
