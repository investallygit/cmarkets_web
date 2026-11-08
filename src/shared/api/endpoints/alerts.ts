import type { AlertDto, AlertInputDto, NotificationDto, Paged } from '../contracts'
import { answer, route, send } from './define'
import type { Page } from './content'

/** CMarket.Api/Controllers/Alerts: the user's alerts and the notifications they sent. */
export const alertsRoutes = {
  list: route('GET', '/alerts', answer<AlertDto[]>()),
  create: route('POST', '/alerts', answer<AlertDto>()),
  update: route('PUT', '/alerts/{id}', answer<AlertDto>()),
  remove: route('DELETE', '/alerts/{id}'),
  notifications: route('GET', '/notifications', answer<Paged<NotificationDto>>()),
  markRead: route('POST', '/notifications/{id}/read'),
}

export const alertsApi = {
  /** The user's alerts, on or off. */
  list: (signal?: AbortSignal) => send(alertsRoutes.list, { signal }),
  /** 409 once the quota of the account type is reached. */
  create: (input: AlertInputDto) => send(alertsRoutes.create, { body: input }),
  /** Edits the condition and channels, or turns the alert on or off. */
  update: (id: string, input: AlertInputDto) =>
    send(alertsRoutes.update, { params: { id }, body: input }),
  remove: (id: string) => send(alertsRoutes.remove, { params: { id } }),
  /** The alerts that went off, newest first. */
  notifications: (page: Page, signal?: AbortSignal) =>
    send(alertsRoutes.notifications, { query: { ...page }, signal }),
  markRead: (id: string) => send(alertsRoutes.markRead, { params: { id } }),
}
