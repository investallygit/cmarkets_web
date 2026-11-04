import type { AlertDto } from '@/shared/api/contracts'
import { DAY_MS, MINUTE_MS } from '../lib/time'
import { notificationMinutesAgo } from './feeds'

/** An alert as the server stores it; the security code and portfolio name are added when read. */
export type StoredAlert = Omit<AlertDto, 'securityCode' | 'portfolioName'>

type AlertFixture = Omit<StoredAlert, 'createdAt' | 'lastTriggeredAt'>

/**
 * Alerts every demo user starts with. The first three went off before the prototype started (the
 * alerts of the screen 1 mockup); SEMC above 52,700 is close enough to the price to go off soon.
 */
// prettier-ignore
const ALERTS: AlertFixture[] = [
  { id: 'alert-1', condition: { type: 'price', securityId: 'BANGE', metric: 'price', direction: 'above', threshold: 26_500 }, channels: ['push', 'email'], enabled: true },
  { id: 'alert-2', condition: { type: 'volume', securityId: 'REGIONALE', multiple: 3 }, channels: ['push'], enabled: true },
  { id: 'alert-3', condition: { type: 'portfolio', portfolioId: null }, channels: ['push', 'email'], enabled: true },
  { id: 'alert-4', condition: { type: 'price', securityId: 'SEMC', metric: 'price', direction: 'above', threshold: 52_700 }, channels: ['push', 'sms'], enabled: true },
  { id: 'alert-5', condition: { type: 'auction', country: null }, channels: ['email'], enabled: true },
  { id: 'alert-6', condition: { type: 'price', securityId: 'SIAT', metric: 'changePct', direction: 'below', threshold: -2 }, channels: ['push'], enabled: true },
  { id: 'alert-7', condition: { type: 'release', securityId: 'SEMC' }, channels: ['push'], enabled: true },
  { id: 'alert-8', condition: { type: 'publication', about: 'analysts', securityId: null, country: null }, channels: ['push', 'email'], enabled: false },
]

const CREATED_DAYS_AGO = 21

/** The alerts of a demo user: the portfolio one only for an account type that reads portfolios. */
export function createAlerts(now: number, readsPortfolios: boolean): StoredAlert[] {
  return ALERTS.flatMap((alert, index) => {
    if (alert.condition.type === 'portfolio' && !readsPortfolios) return []
    const minutesAgo = notificationMinutesAgo(alert.id)
    return {
      ...alert,
      condition: { ...alert.condition },
      channels: [...alert.channels],
      createdAt: new Date(now - (CREATED_DAYS_AGO - index) * DAY_MS).toISOString(),
      lastTriggeredAt:
        minutesAgo === undefined ? null : new Date(now - minutesAgo * MINUTE_MS).toISOString(),
    }
  })
}
