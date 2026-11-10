import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { AlertCondition, AlertDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'

export interface AlertDescription {
  /** What the alert watches: a security code, a country, "My portfolios"... */
  subject: string
  /** The condition in words: "Price above 52,700". */
  condition: string
}

/** Words for an alert in the user's language, for the tables and the form. */
export function useDescribeAlert(): (
  alert: Pick<AlertDto, 'condition' | 'securityCode'> & Partial<Pick<AlertDto, 'portfolioName'>>,
) => AlertDescription {
  const { t } = useTranslation()
  const format = useFormat()
  return useCallback(
    ({ condition, securityCode, portfolioName }) => {
      const security =
        securityCode ?? ('securityId' in condition ? (condition.securityId ?? '') : '')
      const allCountries = t('alerts.allCountries')
      const country = (code: string | null) => (code ? format.country(code) : allCountries)
      const describe = (value: AlertCondition): AlertDescription => {
        switch (value.type) {
          case 'price': {
            const direction = t(`alerts.directions.${value.direction}`)
            const threshold =
              value.metric === 'price'
                ? format.number(value.threshold, Number.isInteger(value.threshold) ? 0 : 2)
                : format.percent(value.threshold)
            return {
              subject: security,
              condition: t(`alerts.conditions.${value.metric}`, { direction, threshold }),
            }
          }
          case 'volume':
            return {
              subject: security,
              condition: t('alerts.conditions.volume', {
                multiple: format.number(value.multiple, Number.isInteger(value.multiple) ? 0 : 1),
              }),
            }
          case 'release':
            return value.country
              ? {
                  subject: country(value.country),
                  condition: t('alerts.conditions.releaseCountry'),
                }
              : { subject: security, condition: t('alerts.conditions.release') }
          case 'auction':
            return { subject: country(value.country), condition: t('alerts.conditions.auction') }
          case 'portfolio':
            return {
              subject: portfolioName ?? t('alerts.subjects.portfolios'),
              condition: t('alerts.conditions.portfolio'),
            }
          case 'publication':
            return {
              subject:
                value.about === 'analysts'
                  ? t('alerts.subjects.analysts')
                  : value.about === 'security'
                    ? security
                    : country(value.country),
              condition: t(`alerts.conditions.publication.${value.about}`),
            }
        }
      }
      return describe(condition)
    },
    [t, format],
  )
}
