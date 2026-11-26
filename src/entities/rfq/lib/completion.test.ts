import { describe, expect, it } from 'vitest'
import { completionTone, formatCompletion } from './completion'

const ratio = (percent: number | null, cases: number) => ({
  percent,
  cases,
  isNew: percent === null,
})

describe('the completion ratio', () => {
  it('is green from 90%, amber from 75%, red below, neutral for a newcomer', () => {
    expect(completionTone(ratio(96, 48))).toBe('up')
    expect(completionTone(ratio(90, 10))).toBe('up')
    expect(completionTone(ratio(89, 25))).toBe('warning')
    expect(completionTone(ratio(75, 8))).toBe('warning')
    expect(completionTone(ratio(64, 45))).toBe('down')
    expect(completionTone(ratio(null, 3))).toBe('neutral')
  })

  it('reads "96% (48)", "93%" without the cases, "New (3)" under 5 cases', () => {
    const labels = {
      percent: (percent: number) => `${percent}%`,
      withCases: (percent: number, cases: number) => `${percent}% (${cases})`,
      newcomer: (cases: number) => `New (${cases})`,
    }
    expect(formatCompletion(ratio(96, 48), labels)).toBe('96% (48)')
    expect(formatCompletion(ratio(93, 42), labels, false)).toBe('93%')
    expect(formatCompletion(ratio(null, 3), labels)).toBe('New (3)')
    expect(formatCompletion(ratio(null, 0), labels, false)).toBe('New (0)')
  })
})
