import type { ChartDrawingDto, ChartDrawingsDto } from '../contracts'
import { answer, route, send } from './define'

/** CMarket.Api/Controllers/Charts: the lines the user drew on a security's price chart. */
export const chartsRoutes = {
  drawings: route('GET', '/charts/{securityId}/drawings', answer<ChartDrawingsDto>()),
  saveDrawings: route('PUT', '/charts/{securityId}/drawings'),
}

export const chartsApi = {
  drawings: (securityId: string, signal?: AbortSignal) =>
    send(chartsRoutes.drawings, { params: { securityId }, signal }),
  /** Replaces the whole list (needs analysis:save). */
  saveDrawings: (securityId: string, drawings: ChartDrawingDto[]) =>
    send(chartsRoutes.saveDrawings, { params: { securityId }, body: { drawings } }),
}
