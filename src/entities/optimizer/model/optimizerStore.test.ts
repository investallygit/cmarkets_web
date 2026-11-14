import { beforeEach, describe, expect, it } from 'vitest'
import type { OptResultDto, OptScenarioDto } from '@/shared/api/contracts'
import { addSecurities, emptySetup } from '../lib/setup'
import {
  editSetup,
  isResultStale,
  leaveScenario,
  newSetup,
  openScenario,
  showResult,
  useOptimizer,
} from './optimizerStore'

const result = {
  lines: [{ securityId: 'SEMC', code: 'SEMC', name: 'SEMC', assetClass: 'equity' }],
} as unknown as OptResultDto

describe('the optimisation the two screens share', () => {
  beforeEach(() => newSetup())

  it('marks a result stale once the setup changes', () => {
    const setup = addSecurities(emptySetup(), ['SEMC', 'BANGE'])
    editSetup(() => setup)
    showResult(result, setup)
    expect(isResultStale(useOptimizer.getState())).toBe(false)
    expect(useOptimizer.getState().resultSaved).toBe(false)
    editSetup((current) => ({ ...current, targetPct: 9 }))
    expect(isResultStale(useOptimizer.getState())).toBe(true)
  })

  it('opens a scenario as saved, with its labels, and leaves it unsaved once deleted', () => {
    const setup = addSecurities(emptySetup(), ['SEMC', 'BANGE'])
    openScenario({
      id: 's-1',
      name: 'CEMAC balanced',
      version: '3',
      dataDate: '2026-10-30',
      setup,
      result,
    } as OptScenarioDto)
    const state = useOptimizer.getState()
    expect(state.scenario).toEqual({
      id: 's-1',
      name: 'CEMAC balanced',
      version: '3',
      dataDate: '2026-10-30',
    })
    expect(state.resultSaved).toBe(true)
    expect(state.labels.SEMC?.code).toBe('SEMC')
    leaveScenario()
    expect(useOptimizer.getState()).toMatchObject({ scenario: null, resultSaved: false })
  })
})
