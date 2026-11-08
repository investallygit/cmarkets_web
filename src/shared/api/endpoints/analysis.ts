import type { IndicatorDto, IndicatorType } from '../contracts'
import { answer, route, send } from './define'
import type { HistoryRange } from './market'

/** CMarket.Api/Controllers/Analysis: the technical indicators. */
export const analysisRoutes = {
  indicator: route('GET', '/indicators/{securityId}', answer<IndicatorDto>()),
}

export const analysisApi = {
  /** A technical indicator over a chart period, computed by the server. */
  indicator: (
    securityId: string,
    indicator: { type: IndicatorType; period: number },
    range: HistoryRange,
    signal?: AbortSignal,
  ) =>
    send(analysisRoutes.indicator, {
      params: { securityId },
      query: { ...indicator, ...range },
      signal,
    }),
}
