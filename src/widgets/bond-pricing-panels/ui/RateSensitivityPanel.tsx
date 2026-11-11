import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { BondPriceDto, BondPriceRequestDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { PricedView } from './PricedView'

interface RateSensitivityPanelProps {
  request: BondPriceRequestDto | null
}

/**
 * Screen 16, rate sensitivity: the clean price for parallel shifts of the yield of ±25, ±50 and
 * ±100 bp, its change in points and the dirty price's in percent, rises in green, falls in red;
 * the yield itself highlighted.
 */
export function RateSensitivityPanel({ request }: RateSensitivityPanelProps) {
  const { t } = useTranslation()
  return (
    <Panel
      title={t('bondPricing.sensitivity')}
      code="BP"
      options={<span>{t('bondPricing.parallelShift')}</span>}
      bodyClassName="flex flex-col"
    >
      <PricedView request={request}>
        {(data, stale) => <Shifts data={data} stale={stale} />}
      </PricedView>
    </Panel>
  )
}

function Shifts({ data, stale }: { data: BondPriceDto; stale: boolean }) {
  const { t } = useTranslation()
  const format = useFormat()
  const tone = (value: number) => (value > 0 ? 'text-up' : value < 0 ? 'text-down' : 'text-primary')
  const header = 'h-row px-2 font-sans text-data font-normal text-secondary'

  return (
    <ScrollArea className={clsx('min-h-0 flex-1', stale && 'opacity-60')}>
      <table className="w-full border-collapse font-mono text-data tabular-nums">
        <caption className="sr-only">{t('bondPricing.sensitivity')}</caption>
        <thead className="bg-panel-header">
          <tr>
            <th scope="col" className={clsx(header, 'text-left')}>
              {t('bondPricing.sensitivityColumns.shift')}
            </th>
            <th scope="col" className={clsx(header, 'text-right')}>
              {t('bondPricing.sensitivityColumns.cleanPrice')}
            </th>
            <th scope="col" className={clsx(header, 'text-right')}>
              {t('bondPricing.sensitivityColumns.priceChange')}
            </th>
            <th scope="col" className={clsx(header, 'text-right')}>
              {t('bondPricing.sensitivityColumns.dirtyChange')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.sensitivity.map((row, index) => {
            const base = row.shiftBp === 0
            return (
              <tr
                key={row.shiftBp}
                aria-current={base || undefined}
                className={clsx('h-row', base ? 'bg-selected' : index % 2 === 1 && 'bg-row-alt')}
              >
                <th scope="row" className="px-2 text-left font-normal">
                  {base ? '0' : t('bondPricing.shift', { value: format.signed(row.shiftBp, 0) })}
                </th>
                <td className="px-2 text-right">{format.number(row.cleanPrice, 4)}</td>
                <td className={clsx('px-2 text-right', tone(row.priceChange))}>
                  {base ? format.number(0, 3) : format.signed(row.priceChange, 3)}
                </td>
                <td className={clsx('px-2 text-right', tone(row.dirtyChangePct))}>
                  {base ? format.percent(0, 2, false) : format.percent(row.dirtyChangePct, 2)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="px-2 py-2 font-sans text-title text-secondary">
        {t('bondPricing.sensitivityNote')}
      </p>
    </ScrollArea>
  )
}
