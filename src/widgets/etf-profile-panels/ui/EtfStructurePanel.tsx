import { useTranslation } from 'react-i18next'
import { useEtf, useEtfLabels } from '@/entities/etf'
import type { EtfDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { DASH, FigureLine } from './words'

/**
 * Screen 19, structure and costs: replication, dividends, domicile and status, fund currency and
 * hedging, benchmark index, inception date, issuer, TER and ISIN. API /etfs/{id}.
 */
export function EtfStructurePanel({ etfId }: { etfId: string }) {
  const { t } = useTranslation()
  const etf = useEtf(etfId)
  return (
    <Panel title={t('panels.etfStructure')} code="DES" bodyClassName="overflow-y-auto">
      <QueryView query={etf}>{(data) => <Structure data={data} />}</QueryView>
    </Panel>
  )
}

function Structure({ data }: { data: EtfDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const labels = useEtfLabels()
  const { identification: a, structure: b, costs: d } = data
  const dividends =
    b.distribution === 'accumulating'
      ? t('etfProfile.structure.accumulating')
      : d.distributionFrequency
        ? t('etfProfile.structure.distributing', {
            frequency: labels.frequency(d.distributionFrequency).toLowerCase(),
          })
        : t('etfProfile.structure.distributingOnly')
  return (
    <dl className="py-1">
      <FigureLine
        label={t('etfProfile.structure.replication')}
        value={labels.replication(b.replication)}
      />
      <FigureLine label={t('etfProfile.structure.dividends')} value={dividends} />
      <FigureLine
        label={t('etfProfile.structure.domicile')}
        value={`${format.country(b.domicile)} · ${b.ucits ? t('etf.ucits') : t('etf.nonUcits')}`}
      />
      <FigureLine
        label={t('etfProfile.structure.currency')}
        value={`${b.fundCurrency} · ${b.hedged ? t('etf.hedged') : t('etf.unhedged')}`}
      />
      <FigureLine label={t('etfProfile.structure.benchmark')} value={data.benchmark ?? DASH} />
      <FigureLine
        label={t('etfProfile.structure.inception')}
        value={data.inceptionDate ? format.isoDate(data.inceptionDate) : DASH}
      />
      <FigureLine
        label={t('etfProfile.structure.issuer')}
        value={a.brand ? `${a.issuer} (${a.brand})` : a.issuer}
      />
      <FigureLine
        label={t('etfProfile.structure.ter')}
        value={t('etfScreener.perYear', { value: format.percent(d.terPct, 2, false) })}
      />
      <FigureLine label={t('etfProfile.structure.isin')} value={a.isin ?? DASH} />
    </dl>
  )
}
