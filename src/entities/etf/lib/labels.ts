import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  DistributionFrequency,
  EtfAssetClass,
  EtfDistribution,
  EtfGeography,
  EtfReplication,
  EtfSector,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'

/** The symbols of the trading currencies; another currency writes its code. */
const SYMBOLS: Readonly<Record<string, string>> = { USD: '$', EUR: '€', GBP: '£' }

export const currencySymbol = (currency: string) => SYMBOLS[currency] ?? currency

/** The exchanges' names as the screen 15 mockup writes them: LSE, Xetra, Euronext Paris. */
const EXCHANGES = ['LSE', 'XETRA', 'PA', 'AS', 'MI', 'US'] as const

/** The words and figures of an ETF on ETFS (screen 15) and its profile, in the user's language. */
export function useEtfLabels() {
  const { t } = useTranslation()
  const format = useFormat()
  return useMemo(() => {
    const amount = (value: number, currency: string, decimals: number) =>
      t('etf.amount', { symbol: currencySymbol(currency), value: format.number(value, decimals) })
    return {
      assetClass: (value: EtfAssetClass) => t(`etf.assetClasses.${value}`),
      geography: (value: EtfGeography) => t(`etf.geographies.${value}`),
      sector: (value: EtfSector) => t(`etf.sectors.${value}`),
      replication: (value: EtfReplication) => t(`etf.replications.${value}`),
      distribution: (value: EtfDistribution) => t(`etf.distributions.${value}`),
      frequency: (value: DistributionFrequency) => t(`etf.frequencies.${value}`),
      /** "LSE", "Xetra", "Euronext Paris"; the code of another. */
      exchange: (code: string) =>
        EXCHANGES.some((known) => known === code)
          ? t(`etf.exchanges.${code as (typeof EXCHANGES)[number]}`)
          : code,
      /** "Equity · Global" (the results' Class). */
      classLine: (assetClass: EtfAssetClass, geography: EtfGeography) =>
        `${t(`etf.assetClasses.${assetClass}`)} · ${t(`etf.geographies.${geography}`)}`,
      /** "$98.4 bn", "€840 M" in English; "98,4 Md $" in French. */
      size: (value: number, currency: string) =>
        value >= 1e9
          ? t('etf.billions', {
              symbol: currencySymbol(currency),
              value: format.number(value / 1e9, 1),
            })
          : t('etf.millions', {
              symbol: currencySymbol(currency),
              value: format.number(value / 1e6, 0),
            }),
      /** "$121.80" in English, "121,80 $" in French. */
      price: (value: number, currency: string) => amount(value, currency, 2),
      /** "1.4 M shares", "38,000 shares". */
      shares: (value: number) =>
        value >= 1e6
          ? t('etf.millionShares', { value: format.number(value / 1e6, 1) })
          : t('etf.shares', { value: format.number(value, 0) }),
    }
  }, [t, format])
}
