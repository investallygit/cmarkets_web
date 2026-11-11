import { useTranslation } from 'react-i18next'
import { useBondAnalytics, ytwDiffers } from '@/entities/bond'
import type { BondAnalyticsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { DASH, useBondWords } from '../lib/words'
import { FigureRows } from './FigureRows'

/**
 * Screen 20, today's analytics: the latest daily calculation (BS's), its prices, yields,
 * durations, convexity, DV01 of 100 million, spreads and the source of its price. API
 * /bonds/{id}/analytics.
 */
export function TodayAnalyticsPanel({ bondId }: { bondId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const analytics = useBondAnalytics(bondId)
  const date = analytics.data?.date ?? null
  return (
    <Panel
      title={t('panels.todaysAnalytics')}
      code="BS"
      options={
        date && <span>{t('bondProfile.analytics.computed', { date: format.isoDate(date) })}</span>
      }
      bodyClassName="overflow-y-auto"
    >
      <QueryView query={analytics}>{(data) => <Figures data={data} />}</QueryView>
    </Panel>
  )
}

function Figures({ data }: { data: BondAnalyticsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const words = useBondWords()
  if (data.date === null) {
    return (
      <p className="p-3 font-sans text-data text-secondary">
        {t('bondProfile.analytics.notComputed')}
      </p>
    )
  }
  const { pricing: b, risk: c } = data
  const dv01 =
    c.dv01 === null ? DASH : `${data.identification.currency} ${format.number(c.dv01, 0)}`
  const source =
    b.priceSource === 'quote' && b.quoteDate
      ? t('bondProfile.analytics.sources.quote', { date: format.isoDate(b.quoteDate) })
      : b.priceSource === 'model'
        ? t('bondProfile.analytics.sources.model', {
            country: format.country(data.identification.country),
          })
        : t('bondProfile.analytics.sources.none')
  return (
    <FigureRows
      rows={[
        {
          label: t('bondProfile.analytics.lines.prices'),
          value: `${words.price(b.cleanPrice)}${b.priceSource === 'model' ? '*' : ''} · ${words.price(b.accruedInterest)} · ${words.price(b.dirtyPrice)}`,
        },
        {
          label: t('bondProfile.analytics.lines.yields'),
          value: `${words.percent(b.ytmPct)} · ${words.percent(b.ytwPct)} · ${words.percent(b.currentYieldPct)}`,
          warning: ytwDiffers(b),
        },
        {
          label: t('bondProfile.analytics.lines.durations'),
          value: `${words.price(c.macaulayDuration)} · ${words.price(c.modifiedDuration)}`,
        },
        {
          label: t('bondProfile.analytics.lines.convexity', {
            currency: data.identification.currency,
          }),
          value: `${words.price(c.convexity)} · ${dv01}`,
        },
        {
          label: t('bondProfile.analytics.lines.spreads'),
          value: `${words.spread(b.creditSpreadBp)} · ${words.spread(b.zSpreadBp)}`,
        },
        { label: t('bondProfile.analytics.lines.source'), value: source },
      ]}
    />
  )
}
