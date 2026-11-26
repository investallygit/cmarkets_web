import { describe, expect, it } from 'vitest'
import type { RfqCriteriaDto } from '@/shared/api/contracts'
import { countryCode3, criteriaChecks, criteriaQuery } from './criteria'

const MOCKUP: RfqCriteriaDto = {
  minYield: 6,
  maxMaturityYears: 3,
  countries: ['CG', 'CM', 'GA'],
  securityTypes: [],
  eligible: 9,
}

const offered = (country: string, remainingYears: number) => ({
  security: {
    id: 'X',
    code: 'X',
    instrument: 'OTA' as const,
    country,
    maturityDate: '2029-11-02',
    isin: null,
  },
  remainingYears,
})

describe('criteriaQuery', () => {
  it('asks the criteria entered only, both kinds as none, the countries sorted', () => {
    expect(
      criteriaQuery(
        {
          minYield: 6,
          maxMaturityYears: null,
          countries: ['GA', 'CM'],
          securityTypes: ['BTA', 'OTA'],
        },
        '2026-11-13',
      ),
    ).toEqual({ settlementDate: '2026-11-13', minYield: 6, countries: ['CM', 'GA'] })
    expect(
      criteriaQuery(
        { minYield: null, maxMaturityYears: 2.5, countries: [], securityTypes: ['OTA'] },
        '2026-11-13',
      ),
    ).toEqual({ settlementDate: '2026-11-13', maxMaturityYears: 2.5, securityTypes: ['OTA'] })
  })
})

describe('criteriaChecks', () => {
  it('checks the mockup offer of a Chad OTA: its yield and maturity met, its country not accepted', () => {
    expect(criteriaChecks(MOCKUP, offered('TD', 1.98), 7.21)).toEqual({
      yield: true,
      maturity: true,
      country: false,
    })
  })

  it('reads a yield under the minimum, a longer maturity, and nothing for an empty criterion', () => {
    expect(criteriaChecks(MOCKUP, offered('CM', 3.2), 5.99)).toEqual({
      yield: false,
      maturity: false,
      country: true,
    })
    const open: RfqCriteriaDto = {
      ...MOCKUP,
      minYield: null,
      maxMaturityYears: null,
      countries: [],
    }
    expect(criteriaChecks(open, offered('TD', 9), null)).toEqual({
      yield: null,
      maturity: null,
      country: null,
    })
  })
})

describe('countryCode3', () => {
  it('writes the CEMAC states in three letters, another code as it comes', () => {
    expect(['CM', 'GA', 'CG', 'TD', 'CF', 'GQ', 'NG'].map(countryCode3)).toEqual([
      'CMR',
      'GAB',
      'COG',
      'TCD',
      'CAF',
      'GNQ',
      'NG',
    ])
  })
})
