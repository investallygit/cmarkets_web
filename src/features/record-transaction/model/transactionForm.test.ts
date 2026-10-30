import { describe, expect, it } from 'vitest'
import type { TransactionDto } from '@/shared/api/contracts'
import {
  estimatedAmount,
  initialTransactionForm,
  toTransactionInput,
  validateTransactionForm,
} from './transactionForm'

const TODAY = '2026-10-30'
const SEMC = { id: 'SEMC', code: 'SEMC', type: 'equity' as const }

describe('transaction form', () => {
  it('starts on today, filled in by "Sell" on a line', () => {
    const form = initialTransactionForm(
      { portfolioId: 'p', preset: { type: 'sell', security: SEMC, price: 52_500 } },
      TODAY,
    )
    expect(form).toMatchObject({ type: 'sell', date: TODAY, security: SEMC, price: 52_500 })
    expect(validateTransactionForm(form, TODAY)).toEqual({ quantity: 'required' })
  })

  it('asks a trade for a whole quantity, a price and fees not below zero', () => {
    const form = { ...initialTransactionForm({ portfolioId: 'p' }, TODAY), security: SEMC }
    expect(validateTransactionForm({ ...form, quantity: 1.5, price: 0, fees: -1 }, TODAY)).toEqual({
      quantity: 'wholeNumber',
      price: 'positive',
      fees: 'positive',
    })
    expect(
      validateTransactionForm({ ...form, date: '2026-11-02', quantity: 10, price: 1 }, TODAY),
    ).toEqual({
      date: 'future',
    })
  })

  it('asks the other types for an amount and the right kind of security', () => {
    const base = initialTransactionForm({ portfolioId: 'p' }, TODAY)
    expect(validateTransactionForm({ ...base, type: 'deposit' }, TODAY)).toEqual({
      amount: 'required',
    })
    expect(
      validateTransactionForm({ ...base, type: 'coupon', security: SEMC, amount: 10 }, TODAY),
    ).toEqual({
      security: 'securityType',
    })
    // Fees may name a security, or not.
    expect(validateTransactionForm({ ...base, type: 'fees', amount: 1_200 }, TODAY)).toEqual({})
  })

  it('sends only the fields of the type', () => {
    const form = {
      ...initialTransactionForm({ portfolioId: 'p' }, TODAY),
      type: 'deposit' as const,
      security: SEMC,
      quantity: 3,
      amount: 1_000_000,
      note: ' Top-up ',
    }
    expect(toTransactionInput(form)).toEqual({
      type: 'deposit',
      date: TODAY,
      securityId: null,
      quantity: null,
      price: null,
      fees: null,
      amount: 1_000_000,
      note: 'Top-up',
    })
    expect(toTransactionInput({ ...form, type: 'buy', price: 52_500 }, '3')).toMatchObject({
      securityId: 'SEMC',
      quantity: 3,
      price: 52_500,
      fees: 0,
      amount: null,
      version: '3',
    })
  })

  it('reopens a recorded transaction with a positive amount', () => {
    const transaction: TransactionDto = {
      id: 'tx-1',
      type: 'withdrawal',
      date: '2026-09-15',
      securityId: null,
      securityCode: null,
      quantity: null,
      price: null,
      fees: 0,
      amount: -60_000_000,
      realizedGain: null,
      note: 'Redemption by a client',
      version: '2',
    }
    expect(initialTransactionForm({ portfolioId: 'p', transaction }, TODAY)).toMatchObject({
      type: 'withdrawal',
      date: '2026-09-15',
      amount: 60_000_000,
      fees: null,
    })
  })

  it('estimates the cash of a share trade, fees included', () => {
    const form = {
      ...initialTransactionForm({ portfolioId: 'p' }, TODAY),
      security: SEMC,
      quantity: 100,
      price: 50_000,
      fees: 500,
    }
    expect(estimatedAmount(form)).toBe(-5_000_500)
    expect(estimatedAmount({ ...form, type: 'sell' })).toBe(4_999_500)
    expect(
      estimatedAmount({ ...form, security: { id: 'GAB', code: 'GAB', type: 'bond' } }),
    ).toBeNull()
  })
})
