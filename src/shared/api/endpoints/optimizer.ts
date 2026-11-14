import type {
  OptCheckDto,
  OptEstimatesDto,
  OptEstimatesRequestDto,
  OptExportFormat,
  OptFrontierPointRequestDto,
  OptRebalanceDto,
  OptResultDto,
  OptScenarioDto,
  OptScenarioInputDto,
  OptScenarioSummaryDto,
  OptSetupDto,
  OptToPortfolioDto,
  PortfolioDto,
} from '../contracts'
import { answer, route, send, sendBlob } from './define'

/**
 * CMarket.Api/Controllers/Optimizer: portfolio optimisation, OPT and OPT RES (spec section 10,
 * "Portfolio optimisation"): the estimates, the check, the run, a point of the frontier and the
 * saved scenarios.
 */
export const optimizerRoutes = {
  estimates: route('POST', '/optimizer/estimates', answer<OptEstimatesDto>()),
  check: route('POST', '/optimizer/check', answer<OptCheckDto>()),
  run: route('POST', '/optimizer/run', answer<OptResultDto>()),
  frontierPoint: route('POST', '/optimizer/frontier-point', answer<OptResultDto>()),
  scenarios: route('GET', '/optimizer/scenarios', answer<OptScenarioSummaryDto[]>()),
  createScenario: route('POST', '/optimizer/scenarios', answer<OptScenarioDto>()),
  scenario: route('GET', '/optimizer/scenarios/{id}', answer<OptScenarioDto>()),
  updateScenario: route('PUT', '/optimizer/scenarios/{id}', answer<OptScenarioDto>()),
  deleteScenario: route('DELETE', '/optimizer/scenarios/{id}'),
  toPortfolio: route('POST', '/optimizer/scenarios/{id}/to-portfolio', answer<PortfolioDto>()),
  rebalance: route('POST', '/optimizer/scenarios/{id}/rebalance', answer<OptRebalanceDto>()),
  exportScenario: route('GET', '/optimizer/scenarios/{id}/export', answer<Blob>()),
}

export const optimizerApi = {
  /** Expected returns, volatilities and correlations of 2 to 20 securities, from their history. */
  estimates: (request: OptEstimatesRequestDto, signal?: AbortSignal) =>
    send(optimizerRoutes.estimates, { body: request, signal }),
  /** What stops a run: the constraints in conflict, a target out of reach, a missing estimate. */
  check: (setup: OptSetupDto, signal?: AbortSignal) =>
    send(optimizerRoutes.check, { body: setup, signal }),
  run: (setup: OptSetupDto) => send(optimizerRoutes.run, { body: setup }),
  /** The allocation of a point of the frontier, the lowest risk for its return. */
  frontierPoint: (request: OptFrontierPointRequestDto) =>
    send(optimizerRoutes.frontierPoint, { body: request }),
  scenarios: (signal?: AbortSignal) => send(optimizerRoutes.scenarios, { signal }),
  /** Computed on today's data and saved. */
  createScenario: (input: OptScenarioInputDto) =>
    send(optimizerRoutes.createScenario, { body: input }),
  scenario: (id: string, signal?: AbortSignal) =>
    send(optimizerRoutes.scenario, { params: { id }, signal }),
  /** Computed again on today's data, with the version read (409 when it changed since). */
  updateScenario: (id: string, input: OptScenarioInputDto) =>
    send(optimizerRoutes.updateScenario, { params: { id }, body: input }),
  deleteScenario: (id: string) => send(optimizerRoutes.deleteScenario, { params: { id } }),
  toPortfolio: (id: string, input: OptToPortfolioDto) =>
    send(optimizerRoutes.toPortfolio, { params: { id }, body: input }),
  /** For information: CMarket sends no orders. */
  rebalance: (id: string, portfolioId: string) =>
    send(optimizerRoutes.rebalance, { params: { id }, query: { portfolioId } }),
  exportScenario: (id: string, format: OptExportFormat, signal?: AbortSignal) =>
    sendBlob(optimizerRoutes.exportScenario, { params: { id }, query: { format }, signal }),
}
