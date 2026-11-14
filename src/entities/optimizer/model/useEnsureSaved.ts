import { useCallback } from 'react'
import { useSaveScenario } from '../api/queries'
import { openScenario, useOptimizer } from './optimizerStore'

/**
 * The next steps of screen 29 work on a saved scenario (spec section 10: /optimizer/scenarios/{id}/
 * to-portfolio, rebalance, export): the result shown, saved first when it is not, as a new
 * scenario under the name given; an open scenario is never saved over without being asked.
 */
export function useEnsureSaved() {
  const save = useSaveScenario()
  const scenario = useOptimizer((state) => state.scenario)
  const resultSaved = useOptimizer((state) => state.resultSaved)
  const ensure = useCallback(
    async (name: string): Promise<string> => {
      const state = useOptimizer.getState()
      if (state.resultSaved && state.scenario) return state.scenario.id
      const setup = state.resultSetup ?? state.setup
      const saved = await save.mutateAsync({ name, setup })
      openScenario(saved)
      return saved.id
    },
    [save],
  )
  return {
    needsSave: !resultSaved || !scenario,
    defaultName: scenario?.name ?? '',
    ensure,
    saving: save.isPending,
  }
}
