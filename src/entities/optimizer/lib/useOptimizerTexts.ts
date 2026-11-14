import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { OptAssetClass, OptConstraintRefDto, OptGroupScope } from '@/shared/api/contracts'
import { ETF_GEOGRAPHIES } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useOptimizer } from '../model/optimizerStore'

const isGeography = (value: string): value is (typeof ETF_GEOGRAPHIES)[number] =>
  ETF_GEOGRAPHIES.some((geography) => geography === value)

/**
 * The words of the optimisation's screens: a security's code, a group's name (a class, a country
 * or an ETF's market, a currency), a constraint as the check and the result name it.
 */
export function useOptimizerTexts() {
  const { t } = useTranslation()
  const format = useFormat()
  const labels = useOptimizer((state) => state.labels)
  return useMemo(() => {
    const pct = (value: number) => format.percent(value, 2, false)
    const code = (securityId: string) => labels[securityId]?.code ?? securityId
    const assetClass = (key: OptAssetClass) => t(`opt.classes.${key}`)
    const group = (scope: OptGroupScope, key: string): string => {
      if (scope === 'assetClass')
        return key === 'equity' || key === 'bond' || key === 'etf'
          ? t(`opt.classTotals.${key}`)
          : key
      if (scope === 'currency') return key
      if (key.startsWith('etf:')) {
        const market = key.slice(4)
        return t('opt.etfMarket', {
          market: isGeography(market) ? t(`etf.geographies.${market}`) : market,
        })
      }
      return format.country(key)
    }
    const constraint = (ref: OptConstraintRefDto): string => {
      const value = pct(ref.valuePct)
      switch (ref.kind) {
        case 'targetReturn':
          return t('opt.constraintRefs.targetReturn', { value })
        case 'targetRisk':
          return t('opt.constraintRefs.targetRisk', { value })
        case 'maxWeight':
          return ref.securityId
            ? t('opt.constraintRefs.maxWeight', { code: code(ref.securityId), value })
            : t('opt.constraintRefs.maxWeightAll', { value })
        case 'securityMin':
          return t('opt.constraintRefs.securityMin', { code: code(ref.securityId), value })
        case 'securityMax':
          return t('opt.constraintRefs.securityMax', { code: code(ref.securityId), value })
        case 'groupMin':
          return t('opt.constraintRefs.groupMin', { group: group(ref.scope, ref.key), value })
        case 'groupMax':
          return t('opt.constraintRefs.groupMax', { group: group(ref.scope, ref.key), value })
      }
    }
    return { pct, code, assetClass, group, constraint }
  }, [format, labels, t])
}
