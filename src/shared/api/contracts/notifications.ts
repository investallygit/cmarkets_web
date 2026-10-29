import type { IsoDateTime } from './common'

export type AlertSeverity = 'info' | 'warning' | 'critical'

/** GET /notifications (paginated), the notification centre of the top bar. */
export interface NotificationDto {
  id: string
  alertId: string | null
  triggeredAt: IsoDateTime
  /** What the alert is about: a security code or a portfolio name. */
  subject: string
  message: string
  severity: AlertSeverity
  read: boolean
}
