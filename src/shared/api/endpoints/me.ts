import type {
  CurveDto,
  CustomCurveUpdateDto,
  CustomCurveWriteDto,
  MeDto,
  MeUpdateDto,
  PasswordChangeDto,
  ScreenLayoutDto,
} from '../contracts'
import { answer, route, send } from './define'

/** CMarket.Api/Controllers/Me: the user's profile, password, saved layouts and custom curves. */
export const meRoutes = {
  get: route('GET', '/me', answer<MeDto>()),
  update: route('PUT', '/me', answer<MeDto>()),
  changePassword: route('PUT', '/me/password'),
  layout: route('GET', '/me/layouts/{screen}', answer<ScreenLayoutDto>()),
  saveLayout: route('PUT', '/me/layouts/{screen}'),
  curves: route('GET', '/me/curves', answer<CurveDto[]>()),
  saveCurve: route('POST', '/me/curves', answer<CurveDto>()),
  updateCurve: route('PUT', '/me/curves/{id}', answer<CurveDto>()),
  deleteCurve: route('DELETE', '/me/curves/{id}'),
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
  /** Kept alive: a save as the user leaves the tab still reaches the server. */
  saveLayout: (screen: string, layout: Omit<ScreenLayoutDto, 'screen'>) =>
    send(meRoutes.saveLayout, { params: { screen }, body: layout, keepalive: true }),
  /** BP's custom curves of the user, and those their organisation shares (fifth version). */
  curves: (signal?: AbortSignal) => send(meRoutes.curves, { signal }),
  /** 409 when the user has a curve of that name already. */
  saveCurve: (curve: CustomCurveWriteDto) => send(meRoutes.saveCurve, { body: curve }),
  /** Its owner alone renames it or shares it. */
  updateCurve: (id: string, update: CustomCurveUpdateDto) =>
    send(meRoutes.updateCurve, { params: { id }, body: update }),
  deleteCurve: (id: string) => send(meRoutes.deleteCurve, { params: { id } }),
}
