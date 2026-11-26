import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { RfqCriteriaDto } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { countryCode3 } from './criteria'

export interface CriteriaDescription {
  /** The board's: "≥ 6.50% · ≤ 2 yrs · all countries". */
  short: string
  /** The request's header: "yield ≥ 6.00% · maturity ≤ 3 yrs · CMR, GAB, COG". */
  long: string
}

/** A request's criteria in the user's language (screen 22, sixth version). */
export function useDescribeCriteria(): (criteria: RfqCriteriaDto) => CriteriaDescription {
  const { t } = useTranslation()
  const format = useFormat()
  return useCallback(
    (criteria) => {
      const yieldValue = criteria.minYield !== null ? format.number(criteria.minYield, 2) : null
      const years =
        criteria.maxMaturityYears !== null
          ? format.number(
              criteria.maxMaturityYears,
              Number.isInteger(criteria.maxMaturityYears) ? 0 : 2,
            )
          : null
      const countries =
        criteria.countries.length > 0
          ? [...criteria.countries]
              .sort((a, b) => cemacOrder(a) - cemacOrder(b))
              .map(countryCode3)
              .join(', ')
          : t('rfqCriteria.allCountries')
      const types = criteria.securityTypes.length === 1 ? criteria.securityTypes[0] : null
      const short = [
        yieldValue && t('rfqCriteria.describe.yield', { value: yieldValue }),
        years && t('rfqCriteria.describe.maturity', { value: years }),
        countries,
        types,
      ]
      const long = [
        yieldValue && t('rfqCriteria.describe.yieldLong', { value: yieldValue }),
        years && t('rfqCriteria.describe.maturityLong', { value: years }),
        countries,
        types,
      ]
      return {
        short: short.filter(Boolean).join(' · '),
        long: long.filter(Boolean).join(' · '),
      }
    },
    [format, t],
  )
}

/** The CEMAC states in the order screen 22 writes them: CMR, GAB, COG, TCD, CAF, GNQ; others after. */
function cemacOrder(code: string): number {
  const index = CEMAC_COUNTRIES.findIndex((country) => country === code)
  return index < 0 ? CEMAC_COUNTRIES.length : index
}
