import type { CalendarAlertSeed } from '@/entities/alert'
import { PUBLISHED_EVENT_TYPES, SECURITY_EVENT_TYPES } from '@/entities/calendar-event'
import type {
  AlertChannel,
  AlertCondition,
  AlertDto,
  AlertInputDto,
  AlertType,
  CalendarEventType,
} from '@/shared/api/contracts'

/** The six types of spec section 5, then the calendar's (sixth version), in the order of the form. */
export const ALERT_TYPES: readonly AlertType[] = [
  'price',
  'volume',
  'release',
  'auction',
  'portfolio',
  'publication',
  'calendar',
]

/** What a calendar alert follows: any event of its type, the user's securities, a security, a country. */
export type CalendarScope = 'any' | 'mine' | 'security' | 'country'

/** A dividend is told two days before (D−2), as the mockup's alert; another event the day before. */
export function defaultDaysBefore(event: CalendarEventType): number {
  if (PUBLISHED_EVENT_TYPES.includes(event)) return 0
  return event === 'dividend' ? 2 : 1
}

/** The scopes an event type allows: a security's for its events, no country for the BEAC's. */
export function calendarScopes(event: CalendarEventType): CalendarScope[] {
  const scopes: CalendarScope[] = ['any']
  if (SECURITY_EVENT_TYPES.includes(event)) scopes.push('mine', 'security')
  if (event !== 'beac') scopes.push('country')
  return scopes
}

export const ALERT_CHANNELS: readonly AlertChannel[] = ['push', 'email', 'sms']

type PriceCondition = Extract<AlertCondition, { type: 'price' }>

/** A news alert follows the news on a security or on a country. */
export type NewsAbout = 'security' | 'country'
type PublicationCondition = Extract<AlertCondition, { type: 'publication' }>

/** Every field of the form; the type decides which ones the alert keeps. */
export interface AlertFormState {
  type: AlertType
  security: { id: string; code: string } | null
  metric: PriceCondition['metric']
  direction: PriceCondition['direction']
  threshold: number | null
  multiple: number | null
  /** '' for any CEMAC country. */
  country: string
  about: PublicationCondition['about']
  /** What a news alert follows: a security or a country (ROADMAP decision 5). */
  newsAbout: NewsAbout
  /** '' for all of the user's portfolios. */
  portfolioId: string
  /** A calendar alert's type of event, what it follows and the days before it goes off. */
  calendarEvent: CalendarEventType
  calendarScope: CalendarScope
  daysBefore: number | null
  channels: AlertChannel[]
  enabled: boolean
}

export type AlertFormField =
  'security' | 'threshold' | 'multiple' | 'country' | 'channels' | 'daysBefore'
export type AlertFormError = 'required' | 'positive' | 'aboveOne' | 'daysRange'

/** The days a calendar alert may ask ahead. */
const MAX_DAYS_BEFORE = 30
export type AlertFormErrors = Partial<Record<AlertFormField, AlertFormError>>

const DEFAULT_MULTIPLE = 3

/** A new alert (on a security, or on an event of the calendar, when given), or the fields of an existing one. */
export function initialAlertForm(
  alert?: AlertDto,
  security?: { id: string; code: string },
  calendar?: CalendarAlertSeed,
): AlertFormState {
  const empty: AlertFormState = {
    type: 'price',
    security: security ?? null,
    metric: 'price',
    direction: 'above',
    threshold: null,
    multiple: DEFAULT_MULTIPLE,
    country: '',
    about: 'analysts',
    newsAbout: 'security',
    portfolioId: '',
    calendarEvent: 'result',
    calendarScope: 'any',
    daysBefore: 0,
    channels: ['push'],
    enabled: true,
  }
  if (!alert && calendar) {
    const scopes = calendarScopes(calendar.event)
    const scope: CalendarScope =
      calendar.securityId && scopes.includes('security')
        ? 'security'
        : calendar.country && scopes.includes('country')
          ? 'country'
          : 'any'
    return {
      ...empty,
      type: 'calendar',
      calendarEvent: calendar.event,
      calendarScope: scope,
      daysBefore: defaultDaysBefore(calendar.event),
      security:
        scope === 'security' && calendar.securityId
          ? { id: calendar.securityId, code: calendar.securityCode ?? calendar.securityId }
          : null,
      country: scope === 'country' ? (calendar.country ?? '') : '',
    }
  }
  if (!alert) return empty
  const { condition } = alert
  const base = {
    ...empty,
    type: condition.type,
    channels: [...alert.channels],
    enabled: alert.enabled,
  }
  const securityOf = (id: string | null) => (id ? { id, code: alert.securityCode ?? id } : null)
  switch (condition.type) {
    case 'price':
      return {
        ...base,
        security: securityOf(condition.securityId),
        metric: condition.metric,
        direction: condition.direction,
        threshold: condition.threshold,
      }
    case 'volume':
      return { ...base, security: securityOf(condition.securityId), multiple: condition.multiple }
    case 'release':
      return {
        ...base,
        newsAbout: condition.country ? 'country' : 'security',
        security: securityOf(condition.securityId),
        country: condition.country ?? '',
      }
    case 'auction':
      return { ...base, country: condition.country ?? '' }
    case 'portfolio':
      return { ...base, portfolioId: condition.portfolioId ?? '' }
    case 'publication':
      return {
        ...base,
        about: condition.about,
        security: securityOf(condition.securityId),
        country: condition.country ?? '',
      }
    case 'calendar':
      return {
        ...base,
        calendarEvent: condition.event,
        calendarScope: condition.mine
          ? 'mine'
          : condition.securityId
            ? 'security'
            : condition.country
              ? 'country'
              : 'any',
        security: securityOf(condition.securityId),
        country: condition.country ?? '',
        daysBefore: condition.daysBefore,
      }
  }
}

/** The security is needed by the price and volume types, and by news or research on it. */
export function needsSecurity(
  form: Pick<AlertFormState, 'type' | 'about' | 'newsAbout'> &
    Partial<Pick<AlertFormState, 'calendarScope'>>,
): boolean {
  return (
    (form.type === 'calendar' && form.calendarScope === 'security') ||
    form.type === 'price' ||
    form.type === 'volume' ||
    (form.type === 'release' && form.newsAbout === 'security') ||
    (form.type === 'publication' && form.about === 'security')
  )
}

/** A country is needed by news or research on a country. */
export function needsCountry(
  form: Pick<AlertFormState, 'type' | 'about' | 'newsAbout'> &
    Partial<Pick<AlertFormState, 'calendarScope'>>,
): boolean {
  return (
    (form.type === 'calendar' && form.calendarScope === 'country') ||
    (form.type === 'release' && form.newsAbout === 'country') ||
    (form.type === 'publication' && form.about === 'country')
  )
}

export function validateAlertForm(form: AlertFormState): AlertFormErrors {
  const errors: AlertFormErrors = {}
  if (needsSecurity(form) && !form.security) errors.security = 'required'
  if (form.type === 'price') {
    if (form.threshold === null) errors.threshold = 'required'
    else if (form.metric === 'price' && form.threshold <= 0) errors.threshold = 'positive'
  }
  if (form.type === 'volume') {
    if (form.multiple === null) errors.multiple = 'required'
    else if (form.multiple <= 1) errors.multiple = 'aboveOne'
  }
  if (needsCountry(form) && !form.country) errors.country = 'required'
  if (form.type === 'calendar' && !PUBLISHED_EVENT_TYPES.includes(form.calendarEvent)) {
    if (form.daysBefore === null) errors.daysBefore = 'required'
    else if (
      form.daysBefore < 0 ||
      form.daysBefore > MAX_DAYS_BEFORE ||
      !Number.isInteger(form.daysBefore)
    )
      errors.daysBefore = 'daysRange'
  }
  if (form.channels.length === 0) errors.channels = 'required'
  return errors
}

/** The body of POST or PUT /alerts; call it on a form without errors. */
export function toAlertInput(form: AlertFormState): AlertInputDto {
  const securityId = form.security?.id ?? ''
  const condition = ((): AlertCondition => {
    switch (form.type) {
      case 'price':
        return {
          type: 'price',
          securityId,
          metric: form.metric,
          direction: form.direction,
          threshold: form.threshold ?? 0,
        }
      case 'volume':
        return { type: 'volume', securityId, multiple: form.multiple ?? DEFAULT_MULTIPLE }
      case 'release':
        return {
          type: 'release',
          securityId: form.newsAbout === 'security' ? securityId : null,
          country: form.newsAbout === 'country' ? form.country : null,
        }
      case 'auction':
        return { type: 'auction', country: form.country || null }
      case 'portfolio':
        return { type: 'portfolio', portfolioId: form.portfolioId || null }
      case 'publication':
        return {
          type: 'publication',
          about: form.about,
          securityId: form.about === 'security' ? securityId : null,
          country: form.about === 'country' ? form.country : null,
        }
      case 'calendar':
        return {
          type: 'calendar',
          event: form.calendarEvent,
          country: form.calendarScope === 'country' ? form.country : null,
          securityId: form.calendarScope === 'security' ? securityId : null,
          mine: form.calendarScope === 'mine',
          daysBefore: PUBLISHED_EVENT_TYPES.includes(form.calendarEvent)
            ? 0
            : (form.daysBefore ?? 0),
        }
    }
  })()
  return {
    condition,
    channels: ALERT_CHANNELS.filter((channel) => form.channels.includes(channel)),
    enabled: form.enabled,
  }
}
