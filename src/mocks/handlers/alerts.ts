import { http, HttpResponse } from 'msw'
import type {
  AlertChannel,
  AlertCondition,
  AlertDto,
  AlertInputDto,
  NotificationDto,
  Paged,
} from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import {
  alertStore,
  currentUser,
  notifications,
  portfolioStore,
  securities,
  sharedPortfolios,
} from '../db'
import type { StoredAlert } from '../fixtures/alerts'
import { api, latency, noContent, paginate, problem } from '../lib/http'

const CHANNELS: readonly AlertChannel[] = ['push', 'email', 'sms']

/** One of the user's portfolios, or one a colleague shares with the organisation. */
function readablePortfolio(id: string) {
  return (
    portfolioStore.read().find((portfolio) => portfolio.id === id) ??
    sharedPortfolios().find((shared) => shared.portfolio.id === id)?.portfolio
  )
}

function toDto(alert: StoredAlert): AlertDto {
  const { condition } = alert
  const securityId = 'securityId' in condition ? condition.securityId : null
  const portfolioId = condition.type === 'portfolio' ? condition.portfolioId : null
  return {
    ...alert,
    securityCode: (securityId && securities.get(securityId)?.code) ?? null,
    portfolioName: (portfolioId && readablePortfolio(portfolioId)?.name) ?? null,
  }
}

type Errors = Record<string, string[]>

const isCountry = (value: unknown) => CEMAC_COUNTRIES.some((country) => country === value)
const isSecurity = (value: unknown) => typeof value === 'string' && securities.has(value)

/** The condition as stored, with the errors by field for anything the server would refuse. */
function readCondition(value: Partial<AlertCondition> | undefined, errors: Errors) {
  const fail = (field: string, message: string) => {
    errors[field] = [message]
    return null
  }
  const condition = value as Record<string, unknown> | undefined
  const securityId = condition?.securityId
  switch (value?.type) {
    case 'price': {
      const { metric, direction, threshold } = value
      if (!isSecurity(securityId)) return fail('securityId', 'Unknown security.')
      if (metric !== 'price' && metric !== 'changePct') return fail('metric', 'Price or change.')
      if (direction !== 'above' && direction !== 'below')
        return fail('direction', 'Above or below.')
      if (typeof threshold !== 'number' || !Number.isFinite(threshold)) {
        return fail('threshold', 'A number is required.')
      }
      if (metric === 'price' && threshold <= 0) return fail('threshold', 'Must be above 0.')
      return {
        type: 'price',
        securityId: String(securityId),
        metric,
        direction,
        threshold,
      } as const
    }
    case 'volume': {
      if (!isSecurity(securityId)) return fail('securityId', 'Unknown security.')
      if (typeof value.multiple !== 'number' || !(value.multiple > 1)) {
        return fail('multiple', 'Must be above 1.')
      }
      return { type: 'volume', securityId: String(securityId), multiple: value.multiple } as const
    }
    case 'release':
      if (!isSecurity(securityId)) return fail('securityId', 'Unknown security.')
      return { type: 'release', securityId: String(securityId) } as const
    case 'auction':
      if (value.country != null && !isCountry(value.country)) {
        return fail('country', 'A CEMAC country.')
      }
      return { type: 'auction', country: value.country ?? null } as const
    // A limit of a portfolio the user holds or reads, as a CEO reads the organisation's.
    case 'portfolio': {
      if (!currentUser().permissions.includes('portfolios:read')) {
        return fail('condition.type', 'Your account type has no portfolios.')
      }
      const portfolioId = value.portfolioId ?? null
      if (portfolioId !== null && !readablePortfolio(portfolioId)) {
        return fail('portfolioId', 'One of the portfolios you hold or read.')
      }
      return { type: 'portfolio', portfolioId } as const
    }
    case 'publication': {
      const { about } = value
      if (about === 'security' && !isSecurity(securityId)) {
        return fail('securityId', 'Unknown security.')
      }
      if (about === 'country' && !isCountry(value.country)) {
        return fail('country', 'A CEMAC country.')
      }
      if (about !== 'analysts' && about !== 'security' && about !== 'country') {
        return fail('about', 'Analysts, security or country.')
      }
      return {
        type: 'publication',
        about,
        securityId: about === 'security' ? String(securityId) : null,
        country: about === 'country' ? (value.country ?? null) : null,
      } as const
    }
    default:
      return fail('condition.type', 'One of the six alert types.')
  }
}

function readInput(body: Partial<AlertInputDto>) {
  const errors: Errors = {}
  const condition = readCondition(body.condition, errors)
  const channels = CHANNELS.filter((channel) => body.channels?.includes(channel))
  if (channels.length === 0) errors.channels = ['Choose at least one channel.']
  if (!condition || Object.keys(errors).length > 0) {
    return { error: problem(400, 'Invalid alert', undefined, errors) }
  }
  return { condition, channels, enabled: body.enabled !== false }
}

const canWrite = () => currentUser().permissions.includes('alerts:write')
const forbidden = () => problem(403, 'Forbidden', 'Your account type cannot set alerts.')
const notFound = (id: unknown) => problem(404, 'Alert not found', `No alert ${String(id)}.`)

export const alertHandlers = [
  http.get(api('/alerts'), async () => {
    await latency()
    if (!canWrite()) return forbidden()
    return HttpResponse.json(alertStore.read().map(toDto))
  }),

  // The quota of the account type (spec section 12) counts every alert, on or off.
  http.post(api('/alerts'), async ({ request }) => {
    await latency()
    if (!canWrite()) return forbidden()
    const input = readInput((await request.json()) as Partial<AlertInputDto>)
    if ('error' in input) return input.error
    const alerts = alertStore.read()
    const { quotas, accountType } = currentUser()
    if (quotas.alerts !== null && alerts.length >= quotas.alerts) {
      return problem(
        409,
        'Alert quota reached',
        `A ${accountType} account can set ${quotas.alerts} alerts.`,
      )
    }
    const alert: StoredAlert = {
      id: `alert-${Date.now().toString(36)}`,
      ...input,
      createdAt: new Date().toISOString(),
      lastTriggeredAt: null,
    }
    alertStore.write([...alerts, alert])
    return HttpResponse.json(toDto(alert), { status: 201 })
  }),

  http.put(api('/alerts/:id'), async ({ params, request }) => {
    await latency()
    if (!canWrite()) return forbidden()
    const input = readInput((await request.json()) as Partial<AlertInputDto>)
    if ('error' in input) return input.error
    const alerts = alertStore.read()
    const alert = alerts.find((candidate) => candidate.id === params.id)
    if (!alert) return notFound(params.id)
    const updated = { ...alert, ...input }
    alertStore.write(alerts.map((candidate) => (candidate === alert ? updated : candidate)))
    return HttpResponse.json(toDto(updated))
  }),

  http.delete(api('/alerts/:id'), async ({ params }) => {
    await latency()
    if (!canWrite()) return forbidden()
    const alerts = alertStore.read()
    if (!alerts.some((candidate) => candidate.id === params.id)) return notFound(params.id)
    alertStore.write(alerts.filter((candidate) => candidate.id !== params.id))
    return noContent()
  }),

  http.get(api('/notifications'), async ({ request }) => {
    await latency()
    return HttpResponse.json<Paged<NotificationDto>>(
      paginate(notifications, new URL(request.url).searchParams),
    )
  }),

  http.post(api('/notifications/:id/read'), ({ params }) => {
    const notification = notifications.find((candidate) => candidate.id === params.id)
    if (!notification) return problem(404, 'Notification not found')
    notification.read = true
    return noContent()
  }),
]
