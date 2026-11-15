import { describe, expect, it } from 'vitest'
import {
  appliedCount,
  criteriaFromParams,
  pageFromParams,
  paramsWithCriteria,
  sortFromParams,
  sortParam,
  withoutBlanks,
} from './agreementCriteria'

describe('the agreements filters in the address', () => {
  it('reads the criteria the API takes, its statuses repeated, unknown values dropped', () => {
    const params = new URLSearchParams(
      'from=2026-10-01&to=2026-10-29&status=concluded&status=cancelled&status=signed&side=sell' +
        '&type=OTA&country=CM&role=requester&minFace=200000000&maxFace=abc&q=%20Ngoma%20&agreement=x',
    )

    expect(criteriaFromParams(params)).toEqual({
      from: '2026-10-01',
      to: '2026-10-29',
      status: ['concluded', 'cancelled'],
      side: 'sell',
      type: 'OTA',
      country: 'CM',
      role: 'requester',
      minFace: 200_000_000,
      q: 'Ngoma',
    })
    expect(criteriaFromParams(new URLSearchParams('from=29/10/2026&type=BTN'))).toEqual({})
  })

  it('writes applied criteria over the old ones, the agreement and the sort kept, the page reset', () => {
    const current = new URLSearchParams('status=expired&agreement=a1&sort=-faceAmount&page=3&q=old')

    const next = paramsWithCriteria(current, {
      status: ['concluded', 'cancelled'],
      emailStatus: [],
      q: '',
      minFace: 0,
    })

    expect(next.toString()).toBe(
      'agreement=a1&sort=-faceAmount&status=concluded&status=cancelled&minFace=0',
    )
    expect(criteriaFromParams(next)).toEqual({ status: ['concluded', 'cancelled'], minFace: 0 })
  })

  it('reads the order and the page, newest first on the first page by default', () => {
    expect(sortFromParams(new URLSearchParams('sort=-faceAmount'))).toEqual({
      id: 'faceAmount',
      desc: true,
    })
    expect(sortFromParams(new URLSearchParams('sort=rank'))).toEqual({
      id: 'createdAt',
      desc: true,
    })
    expect(sortParam({ id: 'number', desc: false })).toBe('number')
    expect(pageFromParams(new URLSearchParams('page=2'))).toBe(2)
    expect(pageFromParams(new URLSearchParams('page=-1'))).toBe(1)
  })

  it('counts the filters applied, the period once', () => {
    expect(appliedCount({ from: '2026-10-01', to: '2026-10-29', side: 'buy' })).toBe(2)
    expect(appliedCount(withoutBlanks({ q: '', status: [] }))).toBe(0)
  })
})
