import type {
  AlertSeverity,
  CalendarEventDto,
  NewsItemDto,
  NotificationDto,
} from '@/shared/api/contracts'
import { DAY_MS, MINUTE_MS, marketDay } from '../lib/time'

type NewsContent = Omit<NewsItemDto, 'id' | 'publishedAt'>

/** News of the screen 1 mockup, dated relative to the moment the prototype starts. */
// prettier-ignore
const NEWS: (NewsContent & { minutesAgo: number })[] = [
  { minutesAgo: 11, source: 'SEMC', headline: 'Annual results: revenue up', topic: 'issuer', securityIds: ['SEMC'], country: 'CM' },
  { minutesAgo: 44, source: 'BEAC', headline: 'Results of the 26-week BTA auction', topic: 'regulator', securityIds: [], country: null },
  { minutesAgo: 90, source: 'COSUMAF', headline: 'Approval granted for a bond issue', topic: 'regulator', securityIds: [], country: null },
  { minutesAgo: 117, source: 'BANGE', headline: 'Notice of annual general meeting', topic: 'issuer', securityIds: ['BANGE'], country: 'GQ' },
  { minutesAgo: 1560, source: 'SAFACAM', headline: 'Dividend payment', topic: 'issuer', securityIds: ['SAFACAM'], country: 'CM' },
  { minutesAgo: 1680, source: 'BVMAC', headline: 'Notice: change in trading hours', topic: 'regulator', securityIds: [], country: null },
  { minutesAgo: 1770, source: 'SIAT', headline: 'Quarterly production release', topic: 'issuer', securityIds: ['SIAT'], country: 'GA' },
  { minutesAgo: 3080, source: 'REGIONALE', headline: 'Half-year report released', topic: 'issuer', securityIds: ['REGIONALE'], country: 'CM' },
]

/** Published one at a time while the prototype runs (real-time NewsPublished). */
// prettier-ignore
export const UPCOMING_NEWS: NewsContent[] = [
  { source: 'SOCAPALM', headline: 'Board proposes a higher dividend', topic: 'issuer', securityIds: ['SOCAPALM'], country: 'CM' },
  { source: 'BEAC', headline: 'Calendar of the next BTA auctions', topic: 'regulator', securityIds: [], country: null },
  { source: 'SCG-RE', headline: 'Renewal of the reinsurance treaties', topic: 'issuer', securityIds: ['SCG-RE'], country: 'GA' },
  { source: 'COSUMAF', headline: 'Consultation on financial analysis rules', topic: 'regulator', securityIds: [], country: null },
]

export function createNews(now: number): NewsItemDto[] {
  return NEWS.map(({ minutesAgo, ...content }, index) => ({
    ...content,
    id: `news-${index + 1}`,
    publishedAt: new Date(now - minutesAgo * MINUTE_MS).toISOString(),
  }))
}

type AlertContent = { subject: string; message: string; severity: AlertSeverity }

// prettier-ignore
const ALERTS: (AlertContent & { minutesAgo: number })[] = [
  { minutesAgo: 30, subject: 'BANGE', message: 'Price above XAF 26,500', severity: 'warning' },
  { minutesAgo: 62, subject: 'REGIONALE', message: 'Volume above 3x the 20-day average', severity: 'warning' },
  { minutesAgo: 97, subject: 'Portfolio Fund A', message: 'SEMC exposure above the 10% limit', severity: 'critical' },
]

/** Triggered one at a time while the prototype runs (real-time AlertTriggered). */
export const UPCOMING_ALERTS: AlertContent[] = [
  { subject: 'SEMC', message: 'Price above XAF 52,800', severity: 'warning' },
  { subject: 'BEAC', message: 'Results of the 13-week BTA auction published', severity: 'info' },
  { subject: 'SIAT', message: 'Change below -2% on the session', severity: 'critical' },
]

export function createNotifications(now: number): NotificationDto[] {
  return ALERTS.map(({ minutesAgo, ...content }, index) => ({
    ...content,
    id: `notification-${index + 1}`,
    alertId: `alert-${index + 1}`,
    triggeredAt: new Date(now - minutesAgo * MINUTE_MS).toISOString(),
    read: false,
  }))
}

// prettier-ignore
const EVENTS: (Omit<CalendarEventDto, 'id' | 'date'> & { inDays: number })[] = [
  { inDays: 0, type: 'auction', title: 'OTA 3 yr — Cameroon', securityId: null, country: 'CM' },
  { inDays: 1, type: 'dividend', title: 'SAFACAM — ex-dividend', securityId: 'SAFACAM', country: 'CM' },
  { inDays: 2, type: 'meeting', title: 'BANGE — AGM', securityId: 'BANGE', country: 'GQ' },
  { inDays: 5, type: 'auction', title: 'BTA 13 weeks — Gabon', securityId: null, country: 'GA' },
  { inDays: 6, type: 'maturity', title: 'Partial redemption ECMR 6.25% 2029', securityId: 'ECMR-6.25-2029', country: 'CM' },
  { inDays: 12, type: 'earnings', title: 'SOCAPALM — half-year results', securityId: 'SOCAPALM', country: 'CM' },
]

export function createCalendar(now: number): CalendarEventDto[] {
  return EVENTS.map(({ inDays, ...event }, index) => ({
    ...event,
    id: `event-${index + 1}`,
    date: marketDay(0, now + inDays * DAY_MS),
  }))
}
