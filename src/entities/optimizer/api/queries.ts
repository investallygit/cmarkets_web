import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  OptFrequency,
  OptHistory,
  OptScenarioDto,
  OptScenarioInputDto,
  OptSetupDto,
} from '@/shared/api/contracts'
import { optimizerApi } from '@/shared/api/endpoints'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { isCheckable } from '../lib/setup'
import { useOptimizer } from '../model/optimizerStore'

/** Prices move once a session: five minutes keep the estimates fresh enough while the setup is edited. */
const ESTIMATES_STALE_TIME = 5 * 60_000

/** The check waits for the typing to pause. */
const CHECK_DEBOUNCE_MS = 400

export const optimizerKeys = {
  all: ['optimizer'] as const,
  estimates: (ids: readonly string[], history: OptHistory, frequency: OptFrequency) =>
    ['optimizer', 'estimates', ids.join(','), history, frequency] as const,
  check: (setup: OptSetupDto) => ['optimizer', 'check', JSON.stringify(setup)] as const,
  scenarios: () => ['optimizer', 'scenarios'] as const,
  scenario: (id: string) => ['optimizer', 'scenarios', id] as const,
}

/** The estimates of the universe: expected returns, volatilities, correlations, flags. */
export function useOptEstimates(
  ids: readonly string[],
  history: OptHistory,
  frequency: OptFrequency,
) {
  return useQuery({
    queryKey: optimizerKeys.estimates(ids, history, frequency),
    queryFn: ({ signal }) =>
      optimizerApi.estimates({ securityIds: [...ids], history, frequency }, signal),
    enabled: ids.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: ESTIMATES_STALE_TIME,
  })
}

/** The pre-run check of a setup, once it has two securities and its target; the last one stays meanwhile. */
export function useOptCheck(setup: OptSetupDto) {
  return useQuery({
    queryKey: optimizerKeys.check(setup),
    queryFn: ({ signal }) => optimizerApi.check(setup, signal),
    enabled: isCheckable(setup),
    placeholderData: keepPreviousData,
    staleTime: ESTIMATES_STALE_TIME,
    retry: false,
  })
}

export function useOptScenarios({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: optimizerKeys.scenarios(),
    queryFn: ({ signal }) => optimizerApi.scenarios(signal),
    enabled,
  })
}

export function useOptScenario(id: string | null | undefined) {
  return useQuery({
    queryKey: optimizerKeys.scenario(id ?? ''),
    queryFn: ({ signal }) => optimizerApi.scenario(id ?? '', signal),
    enabled: !!id,
  })
}

export function useRunOptimization() {
  return useMutation({ mutationFn: (setup: OptSetupDto) => optimizerApi.run(setup) })
}

export function useFrontierPoint() {
  return useMutation({
    mutationFn: ({ setup, returnPct }: { setup: OptSetupDto; returnPct: number }) =>
      optimizerApi.frontierPoint({ setup, returnPct }),
  })
}

/** Saves a new scenario, or an open one again (with its version), computed on today's data. */
export function useSaveScenario() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: OptScenarioInputDto & { id?: string }) =>
      id ? optimizerApi.updateScenario(id, input) : optimizerApi.createScenario(input),
    onSuccess: (scenario: OptScenarioDto) => {
      client.setQueryData(optimizerKeys.scenario(scenario.id), scenario)
      void client.invalidateQueries({ queryKey: optimizerKeys.scenarios() })
    },
  })
}

export function useDeleteScenario() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => optimizerApi.deleteScenario(id),
    onSuccess: (_, id) => {
      client.removeQueries({ queryKey: optimizerKeys.scenario(id) })
      void client.invalidateQueries({ queryKey: optimizerKeys.scenarios() })
    },
  })
}

/** The trades that would bring a portfolio to the allocation, for information. */
export function useOptRebalance() {
  return useMutation({
    mutationFn: ({ scenarioId, portfolioId }: { scenarioId: string; portfolioId: string }) =>
      optimizerApi.rebalance(scenarioId, portfolioId),
  })
}

/**
 * The check of the setup being edited, asked once the typing pauses; `settled` once it answers for
 * the setup as it stands, which OPTIMISE waits for.
 */
export function useCurrentCheck() {
  const setup = useOptimizer((state) => state.setup)
  const debounced = useDebouncedValue(setup, CHECK_DEBOUNCE_MS)
  const check = useOptCheck(debounced)
  return { check, settled: debounced === setup && !check.isPlaceholderData && !check.isFetching }
}
