import type { MeDto, MeUpdateDto, PasswordChangeDto, ScreenLayoutDto } from '../contracts'
import { answer, route, send } from './define'

/** CMarket.Api/Controllers/Me: the user's profile, password and saved layouts. */
export const meRoutes = {
  get: route('GET', '/me', answer<MeDto>()),
  update: route('PUT', '/me', answer<MeDto>()),
  changePassword: route('PUT', '/me/password'),
  layout: route('GET', '/me/layouts/{screen}', answer<ScreenLayoutDto>()),
  saveLayout: route('PUT', '/me/layouts/{screen}'),
}

export const meApi = {
  get: (signal?: AbortSignal) => send(meRoutes.get, { signal }),
  /** The profile of CFG; the language and time zone apply at once. */
  update: (update: MeUpdateDto) => send(meRoutes.update, { body: update }),
  /** The current password, then the new one; the other sessions end. */
  changePassword: (change: PasswordChangeDto) => send(meRoutes.changePassword, { body: change }),
  /** 404 when the screen's layout was never saved. */
  layout: (screen: string, signal?: AbortSignal) =>
    send(meRoutes.layout, { params: { screen }, signal }),
  saveLayout: (screen: string, layout: Omit<ScreenLayoutDto, 'screen'>) =>
    send(meRoutes.saveLayout, { params: { screen }, body: layout }),
}
