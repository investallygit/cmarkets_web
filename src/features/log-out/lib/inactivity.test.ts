import { describe, expect, it } from 'vitest'
import { inactivityState } from './inactivity'

const minutes = (value: number) => value * 60_000

describe('inactivityState', () => {
  it('warns during the last minute, then logs out at 30 minutes', () => {
    expect(inactivityState(minutes(5))).toEqual({ phase: 'active', remainingMs: minutes(25) })
    expect(inactivityState(minutes(29) + 15_000)).toEqual({ phase: 'warning', remainingMs: 45_000 })
    expect(inactivityState(minutes(30))).toEqual({ phase: 'expired', remainingMs: 0 })
    expect(inactivityState(minutes(90)).phase).toBe('expired')
  })
})
