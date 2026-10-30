import type { AlertSeverity, NewsItemDto, NotificationDto } from '@/shared/api/contracts'
import { MINUTE_MS } from '../lib/time'

type NewsContent = Omit<NewsItemDto, 'id' | 'publishedAt'>

/**
 * News of the screen 1 mockup, then older items for the filters of the N screen, dated relative
 * to the moment the prototype starts.
 */
// prettier-ignore
const NEWS: (NewsContent & { minutesAgo: number })[] = [
  { minutesAgo: 11, source: 'SEMC', headline: 'Annual results: revenue up', topic: 'issuer', securityIds: ['SEMC'], country: 'CM' },
  { minutesAgo: 44, source: 'BEAC', headline: 'Results of the 26-week BTA auction', topic: 'regulator', securityIds: [], country: 'CM' },
  { minutesAgo: 90, source: 'COSUMAF', headline: 'Approval granted for a bond issue', topic: 'regulator', securityIds: [], country: null },
  { minutesAgo: 117, source: 'BANGE', headline: 'Notice of annual general meeting', topic: 'issuer', securityIds: ['BANGE'], country: 'GQ' },
  { minutesAgo: 1560, source: 'SAFACAM', headline: 'Dividend payment', topic: 'issuer', securityIds: ['SAFACAM'], country: 'CM' },
  { minutesAgo: 1680, source: 'BVMAC', headline: 'Notice: change in trading hours', topic: 'regulator', securityIds: [], country: null },
  { minutesAgo: 1770, source: 'SIAT', headline: 'Quarterly production release', topic: 'issuer', securityIds: ['SIAT'], country: 'GA' },
  { minutesAgo: 3080, source: 'REGIONALE', headline: 'Half-year report released', topic: 'issuer', securityIds: ['REGIONALE'], country: 'CM' },
  { minutesAgo: 4410, source: 'BEAC', headline: 'Monetary policy committee keeps the policy rate at 5.00%', topic: 'regulator', securityIds: [], country: null },
  { minutesAgo: 5790, source: 'SEMC', headline: 'Board approves the 2027 investment plan', topic: 'issuer', securityIds: ['SEMC'], country: 'CM' },
  { minutesAgo: 7240, source: 'BVMAC', headline: 'Weekly market review: equities up 0.8%', topic: 'market', securityIds: [], country: null },
  { minutesAgo: 8650, source: 'SCG-RE', headline: 'Change in the board of directors', topic: 'issuer', securityIds: ['SCG-RE'], country: 'GA' },
  { minutesAgo: 10_120, source: 'COSUMAF', headline: 'Listing approved for a Republic of Chad bond', topic: 'regulator', securityIds: [], country: 'TD' },
  { minutesAgo: 11_530, source: 'SAFACAM', headline: 'Third-quarter revenue release', topic: 'issuer', securityIds: ['SAFACAM'], country: 'CM' },
  { minutesAgo: 14_420, source: 'BVMAC', headline: 'Weekly market review: bond volumes at a record', topic: 'market', securityIds: ['ECMR-6.25-2029', 'GAB-6.50-2028'], country: null },
]

/** A news item still to come; `auctionResults` marks a BEAC result release, for auction alerts. */
export type UpcomingNews = NewsContent & { auctionResults?: boolean }

/** Published one at a time while the prototype runs (real-time NewsPublished). */
// prettier-ignore
export const UPCOMING_NEWS: UpcomingNews[] = [
  { source: 'SOCAPALM', headline: 'Board proposes a higher dividend', topic: 'issuer', securityIds: ['SOCAPALM'], country: 'CM' },
  { source: 'BEAC', headline: 'Results of the 3-year OTA auction — Gabon', topic: 'regulator', securityIds: [], country: 'GA', auctionResults: true },
  { source: 'SEMC', headline: 'Third-quarter revenue release', topic: 'issuer', securityIds: ['SEMC'], country: 'CM' },
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

/** Text of an article; the samples above only have headlines. */
export function articleBody(item: NewsItemDto): string[] {
  return [
    `Announcement published by ${item.source}.`,
    'This is a sample article of the CMarket prototype. African news is entered by the Data ' +
      'admin in the back-office; news on European and US markets comes from EODHD.',
    item.securityIds.length > 0
      ? `Securities concerned: ${item.securityIds.join(', ')}. The article also appears in the N tab of their profile.`
      : 'The announcement concerns the whole market.',
  ]
}

type AlertContent = Pick<NotificationDto, 'alertId' | 'subject' | 'message'> & {
  severity: AlertSeverity
}

/** Alerts triggered before the prototype started, those of the screen 1 mockup. */
// prettier-ignore
const NOTIFICATIONS: (AlertContent & { minutesAgo: number })[] = [
  { minutesAgo: 30, alertId: 'alert-1', subject: 'BANGE', message: 'Price above XAF 26,500', severity: 'warning' },
  { minutesAgo: 62, alertId: 'alert-2', subject: 'REGIONALE', message: 'Volume above 3x the 20-day average', severity: 'warning' },
  { minutesAgo: 97, alertId: 'alert-3', subject: 'Portfolio Fund A', message: 'SEMC exposure above the 10% limit', severity: 'critical' },
]

export function createNotifications(now: number): NotificationDto[] {
  return NOTIFICATIONS.map(({ minutesAgo, ...content }, index) => ({
    ...content,
    id: `notification-${index + 1}`,
    triggeredAt: new Date(now - minutesAgo * MINUTE_MS).toISOString(),
    read: false,
  }))
}

/** When each sample alert last went off, for the alert list of the ALRT screen. */
export function notificationMinutesAgo(alertId: string): number | undefined {
  return NOTIFICATIONS.find((notification) => notification.alertId === alertId)?.minutesAgo
}
