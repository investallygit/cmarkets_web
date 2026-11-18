import { describe, expect, it } from 'vitest'
import {
  addSecurities,
  checkBlocker,
  constraintCount,
  emptySetup,
  enteredCorrelation,
  isCheckable,
  removeSecurity,
  setCorrelation,
  setGroup,
  shortCode,
  updateItem,
} from './setup'

const ids = (count: number) => Array.from({ length: count }, (_, index) => `S${index + 1}`)

describe('optimisation setup', () => {
  it('adds each security once, 20 at most', () => {
    const setup = addSecurities(emptySetup(), [...ids(22), 'S1'])
    expect(setup.universe).toHaveLength(20)
    expect(addSecurities(setup, ['s1']).universe).toHaveLength(20)
  })

  it('takes a security away with the correlations entered with it', () => {
    let setup = addSecurities(emptySetup(), ['SEMC', 'BANGE', 'IWDA.LSE'])
    setup = setCorrelation(setup, 'SEMC', 'BANGE', 0.3)
    setup = setCorrelation(setup, 'BANGE', 'IWDA.LSE', 0.2)
    setup = removeSecurity(setup, 'SEMC')
    expect(setup.universe.map((item) => item.securityId)).toEqual(['BANGE', 'IWDA.LSE'])
    expect(setup.correlations).toEqual([{ a: 'BANGE', b: 'IWDA.LSE', value: 0.2 }])
  })

  it('keeps one correlation a pair, whichever way round, within -1 and 1', () => {
    let setup = addSecurities(emptySetup(), ['A', 'B'])
    setup = setCorrelation(setup, 'A', 'B', 0.5)
    setup = setCorrelation(setup, 'B', 'A', 1.4)
    expect(setup.correlations).toEqual([{ a: 'B', b: 'A', value: 1 }])
    expect(enteredCorrelation(setup.correlations, 'A', 'B')).toBe(1)
    expect(setCorrelation(setup, 'A', 'B', null).correlations).toEqual([])
  })

  it('counts the constraints as the result does: the mockup has seven', () => {
    let setup = addSecurities(emptySetup(), ['SEMC', 'SAFACAM', 'IWDA.LSE'])
    setup = updateItem(setup, 'SEMC', { maxWeightPct: 15 })
    setup = updateItem(setup, 'IWDA.LSE', { maxWeightPct: 20 })
    setup = setGroup(setup, 'assetClass', 'equity', { minPct: null, maxPct: 40 })
    setup = setGroup(setup, 'assetClass', 'bond', { minPct: 30, maxPct: null })
    setup = setGroup(setup, 'assetClass', 'etf', { minPct: null, maxPct: 20 })
    expect(constraintCount(setup)).toBe(7)
    expect(constraintCount({ ...setup, objective: 'maxSharpe' })).toBe(6)
  })

  it('drops a group whose limits are both cleared', () => {
    let setup = setGroup(emptySetup(), 'currency', 'USD', { minPct: null, maxPct: 15 })
    setup = setGroup(setup, 'currency', 'USD', { minPct: 5, maxPct: 15 })
    expect(setup.groups).toEqual([{ scope: 'currency', key: 'USD', minPct: 5, maxPct: 15 }])
    expect(setGroup(setup, 'currency', 'USD', { minPct: null, maxPct: null }).groups).toEqual([])
  })

  it('checks a setup once it has two securities and its target', () => {
    const setup = addSecurities(emptySetup(), ['A'])
    expect(isCheckable(setup)).toBe(false)
    expect(isCheckable(addSecurities(setup, ['B']))).toBe(true)
    expect(isCheckable({ ...addSecurities(setup, ['B']), targetPct: null })).toBe(false)
    expect(
      isCheckable({ ...addSecurities(setup, ['B']), objective: 'minRisk', targetPct: null }),
    ).toBe(true)
  })

  it('says what keeps a setup from its checks (B36)', () => {
    const two = addSecurities(emptySetup(), ['A', 'B'])
    expect(checkBlocker(two)).toBeNull()
    expect(checkBlocker(emptySetup())).toBe('universe')
    expect(checkBlocker({ ...two, capital: 0 })).toBe('capital')
    expect(checkBlocker({ ...two, capital: -5 })).toBe('capital')
    expect(checkBlocker({ ...two, targetPct: null })).toBe('target')
  })

  it('shortens the codes of the correlation grid', () => {
    expect(shortCode('SAFACAM')).toBe('SAFA')
    expect(shortCode('ECMR 6.25% 29')).toBe('ECMR')
    expect(shortCode('IWDA')).toBe('IWDA')
  })
})
