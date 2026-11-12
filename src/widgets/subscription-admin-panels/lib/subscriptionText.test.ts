import { describe, expect, it } from 'vitest'
import { membersLine, pageCount, queryOf, sortColumn } from './subscriptionText'

describe('membersLine', () => {
  it('names each type of member with its count, the most numerous first as the API sends them', () => {
    expect(
      membersLine(
        [
          { type: 'manager', count: 4 },
          { type: 'ceo', count: 1 },
        ],
        (member) => `${member.type} ×${member.count}`,
      ),
    ).toBe('manager ×4, ceo ×1')
    expect(membersLine([], () => 'x')).toBe('')
  })
})

describe('pageCount', () => {
  it('counts the pages, one at least', () => {
    expect(pageCount(1871, 14)).toBe(134)
    expect(pageCount(0, 50)).toBe(1)
    expect(pageCount(50, 50)).toBe(1)
    expect(pageCount(51, 50)).toBe(2)
  })
})

describe('queryOf', () => {
  it('reads the filters of the address, by expiry by default', () => {
    expect(queryOf(new URLSearchParams(), '')).toEqual({
      q: undefined,
      plan: undefined,
      status: undefined,
      expiringWithinDays: undefined,
      sort: 'expiry',
    })
    expect(
      queryOf(
        new URLSearchParams('plan=analysis&status=paymentFailed&expiry=30&sort=-lastPayment'),
        'tamba',
      ),
    ).toEqual({
      q: 'tamba',
      plan: 'analysis',
      status: 'paymentFailed',
      expiringWithinDays: 30,
      sort: '-lastPayment',
    })
  })

  it('leaves out what the API would refuse', () => {
    expect(queryOf(new URLSearchParams('status=late&expiry=12&sort=price'), '')).toEqual({
      q: undefined,
      plan: undefined,
      status: undefined,
      expiringWithinDays: undefined,
      sort: 'expiry',
    })
  })
})

describe('sortColumn', () => {
  it('splits the direction from the column', () => {
    expect(sortColumn('-expiry')).toEqual({ id: 'expiry', desc: true })
    expect(sortColumn('plan')).toEqual({ id: 'plan', desc: false })
    expect(sortColumn(undefined)).toEqual({ id: 'expiry', desc: false })
    expect(sortColumn('price')).toEqual({ id: 'expiry', desc: false })
  })
})
