import type { TFunction } from 'i18next'
import type { YieldCurvePointDto } from '@/shared/api/contracts'

/**
 * What gave a point and when, as its tooltip line says it: an auction or a BVMAC close; a point of
 * the state's series with its type, its source and its security; one the concluded RFQ agreements
 * gave (ROADMAP step 49) names them in place of its source, "Secondary market · 2 RFQ agreements".
 */
export function pointNote(
  t: TFunction,
  point: YieldCurvePointDto,
  formatDate: (iso: string) => string,
): string {
  const series = point.series
  const origin = series
    ? [
        t(`curves.pointTypes.${series.pointType}`),
        series.agreements > 0
          ? t('curves.rfqAgreements', { count: series.agreements })
          : t(`curves.pointSources.${series.source}`),
        series.referenceSecurity,
      ]
    : [t(`curves.sources.${point.source === 'quote' ? 'quote' : 'auction'}`)]
  return [...origin, formatDate(point.asOf)].filter(Boolean).join(' · ')
}
