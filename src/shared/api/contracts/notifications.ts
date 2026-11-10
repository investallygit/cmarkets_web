import type { IsoDateTime } from './common'
import type { NewsSourceDto, NewsType } from './news'

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
  /**
   * The news item behind a news alert: its two tags start the notification, as in
   * "[FLASH · MEDIA I] SEMC: annual results up" (spec section 16); null for the other alerts.
   */
  news: NotificationNewsDto | null
}

export interface NotificationNewsDto {
  id: string
  type: NewsType
  source: NewsSourceDto
}
