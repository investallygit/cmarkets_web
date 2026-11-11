import { describe, expect, it } from 'vitest'
import { canRecalculate, needsPayment, statusChoices } from './statusOptions'

describe('statement status choices', () => {
  it('offers every status but the current one, Computed always', () => {
    expect(statusChoices('underReview')).toEqual([
      'computed',
      'toApprove',
      'approved',
      'paid',
      'disputed',
      'onHold',
    ])
    expect(statusChoices('computed')).toContain('computed')
  })

  it('asks the payment for Paid only', () => {
    expect(needsPayment('paid')).toBe(true)
    expect(needsPayment('approved')).toBe(false)
    expect(needsPayment('')).toBe(false)
  })

  it('recalculates a statement not approved yet, on hold from one too', () => {
    expect(canRecalculate({ status: 'toApprove', previousStatus: null })).toBe(true)
    expect(canRecalculate({ status: 'onHold', previousStatus: 'underReview' })).toBe(true)
    expect(canRecalculate({ status: 'onHold', previousStatus: 'approved' })).toBe(false)
    expect(canRecalculate({ status: 'paid', previousStatus: null })).toBe(false)
  })
})
