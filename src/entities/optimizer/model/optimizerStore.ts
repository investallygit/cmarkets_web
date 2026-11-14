import { create } from 'zustand'
import type {
  IsoDate,
  OptAssetClass,
  OptResultDto,
  OptScenarioDto,
  OptSetupDto,
} from '@/shared/api/contracts'
import { emptySetup } from '../lib/setup'

/** What the screens show of a security before its estimates arrive. */
export interface OptSecurityLabel {
  code: string
  name: string
  assetClass: OptAssetClass | null
}

/** The saved scenario the setup comes from: its name, version (PUT) and data date. */
export interface OpenScenario {
  id: string
  name: string
  version: string
  dataDate: IsoDate
}

interface OptimizerState {
  /** The setup OPT edits. */
  setup: OptSetupDto
  labels: Readonly<Record<string, OptSecurityLabel>>
  /** The result OPT RES shows, and the setup it was computed from. */
  result: OptResultDto | null
  resultSetup: OptSetupDto | null
  /** The result shown is the open scenario's, as saved: the next steps can use it as it is. */
  resultSaved: boolean
  scenario: OpenScenario | null
}

/**
 * The optimisation the two screens share (spec screens 28 and 29): the setup being edited, the
 * last result and the scenario they belong to. OPT edits, OPT RES reads; they live as long as the
 * session's page does.
 */
export const useOptimizer = create<OptimizerState>()(() => ({
  setup: emptySetup(),
  labels: {},
  result: null,
  resultSetup: null,
  resultSaved: false,
  scenario: null,
}))

export function editSetup(change: (setup: OptSetupDto) => OptSetupDto): void {
  useOptimizer.setState((state) => ({ setup: change(state.setup) }))
}

export function addLabels(labels: Readonly<Record<string, OptSecurityLabel>>): void {
  useOptimizer.setState((state) => ({ labels: { ...state.labels, ...labels } }))
}

/** A result computed now from the setup. */
export function showResult(result: OptResultDto, setup: OptSetupDto): void {
  useOptimizer.setState({ result, resultSetup: setup, resultSaved: false })
}

/** A saved scenario opened, or saved: its setup, its result as computed, its version. */
export function openScenario(scenario: OptScenarioDto): void {
  const labels = Object.fromEntries(
    scenario.result.lines.map((line) => [
      line.securityId,
      { code: line.code, name: line.name, assetClass: line.assetClass },
    ]),
  )
  useOptimizer.setState((state) => ({
    setup: scenario.setup,
    labels: { ...state.labels, ...labels },
    result: scenario.result,
    resultSetup: scenario.setup,
    resultSaved: true,
    scenario: {
      id: scenario.id,
      name: scenario.name,
      version: scenario.version,
      dataDate: scenario.dataDate,
    },
  }))
}

/** A new, empty setup, out of any scenario. */
export function newSetup(): void {
  useOptimizer.setState({
    setup: emptySetup(),
    result: null,
    resultSetup: null,
    resultSaved: false,
    scenario: null,
  })
}

/** The scenario deleted: its setup and result stay on screen, unsaved. */
export function leaveScenario(): void {
  useOptimizer.setState({ scenario: null, resultSaved: false })
}

/** Whether the setup changed since the result was computed. */
export function isResultStale(state: Pick<OptimizerState, 'setup' | 'resultSetup'>): boolean {
  return (
    state.resultSetup !== null && JSON.stringify(state.setup) !== JSON.stringify(state.resultSetup)
  )
}
