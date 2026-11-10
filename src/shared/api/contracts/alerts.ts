import type { IsoDateTime } from './common'

/** Push notification, e-mail or SMS (spec section 5). */
export type AlertChannel = 'push' | 'email' | 'sms'

/** What an alert watches: the six alert types of spec section 5. */
export type AlertCondition =
  /** A price or percentage-change threshold is crossed. */
  | {
      type: 'price'
      securityId: string
      metric: 'price' | 'changePct'
      direction: 'above' | 'below'
      threshold: number
    }
  /** Unusual volume: the session volume goes above `multiple` times the 20-day average. */
  | { type: 'volume'; securityId: string; multiple: number }
  /**
   * News on a security (a release of its issuer, news naming it) or on a country: exactly one of
   * the two. An ARTICLE notifies in the app, a FLASH also by the alert's channels (spec section 16).
   */
  | { type: 'release'; securityId: string | null; country: string | null }
  /** Results of a government securities auction; null: any CEMAC country. */
  | { type: 'auction'; country: string | null }
  /** A limit of a portfolio is breached; null: any of the user's portfolios. */
  | { type: 'portfolio'; portfolioId: string | null }
  /** A new publication from a followed analyst, or on a security or a country. */
  | {
      type: 'publication'
      about: 'analysts' | 'security' | 'country'
      securityId: string | null
      country: string | null
    }

export type AlertType = AlertCondition['type']

/** POST /alerts returns the new AlertDto, PUT /alerts/{id} the updated one. */
export interface AlertInputDto {
  condition: AlertCondition
  channels: AlertChannel[]
  enabled: boolean
}

/** GET /alerts. The count is limited by the account type (quotas of GET /me). */
export interface AlertDto extends AlertInputDto {
  id: string
  /** Display code of the security the condition names, e.g. "ECMR 6.25% 29". */
  securityCode: string | null
  /** Name of the portfolio a portfolio alert watches; null for all of the user's portfolios. */
  portfolioName: string | null
  createdAt: IsoDateTime
  lastTriggeredAt: IsoDateTime | null
}
