import type {
  AlertChannel,
  AlertCondition,
  AlertDto,
  AlertInputDto,
  AlertType,
} from '@/shared/api/contracts'

/** The six types of spec section 5, in the order of the form. */
export const ALERT_TYPES: readonly AlertType[] = [
  'price',
  'volume',
  'release',
  'auction',
  'portfolio',
  'publication',
]

export const ALERT_CHANNELS: readonly AlertChannel[] = ['push', 'email', 'sms']

type PriceCondition = Extract<AlertCondition, { type: 'price' }>
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
  channels: AlertChannel[]
  enabled: boolean
}

export type AlertFormField = 'security' | 'threshold' | 'multiple' | 'country' | 'channels'
export type AlertFormError = 'required' | 'positive' | 'aboveOne'
export type AlertFormErrors = Partial<Record<AlertFormField, AlertFormError>>

const DEFAULT_MULTIPLE = 3

/** A new alert (on a security when given), or the fields of an existing one. */
export function initialAlertForm(
  alert?: AlertDto,
  security?: { id: string; code: string },
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
    channels: ['push'],
    enabled: true,
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
      return { ...base, security: securityOf(condition.securityId) }
    case 'auction':
      return { ...base, country: condition.country ?? '' }
    case 'portfolio':
      return base
    case 'publication':
      return {
        ...base,
        about: condition.about,
        security: securityOf(condition.securityId),
        country: condition.country ?? '',
      }
  }
}

/** The security is needed by the price, volume and release types, and by a publication on it. */
export function needsSecurity(form: Pick<AlertFormState, 'type' | 'about'>): boolean {
  return (
    form.type === 'price' ||
    form.type === 'volume' ||
    form.type === 'release' ||
    (form.type === 'publication' && form.about === 'security')
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
  if (form.type === 'publication' && form.about === 'country' && !form.country) {
    errors.country = 'required'
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
        return { type: 'release', securityId }
      case 'auction':
        return { type: 'auction', country: form.country || null }
      case 'portfolio':
        return { type: 'portfolio', portfolioId: null }
      case 'publication':
        return {
          type: 'publication',
          about: form.about,
          securityId: form.about === 'security' ? securityId : null,
          country: form.about === 'country' ? form.country : null,
        }
    }
  })()
  return {
    condition,
    channels: ALERT_CHANNELS.filter((channel) => form.channels.includes(channel)),
    enabled: form.enabled,
  }
}
