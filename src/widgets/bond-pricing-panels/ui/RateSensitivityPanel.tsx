import { clsx } from 'clsx'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBondPrice } from '@/entities/bond'
import {
  STANDARD_TENORS,
  type BondPriceDto,
  type BondPriceRequestDto,
  type StandardTenor,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Select } from '@/shared/ui/form/Select'
import { Panel } from '@/shared/ui/Panel'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { PricedView } from './PricedView'
import { modeKey, shocksByTenor } from '../lib/modes'

/** The value of the shock drop-down for a parallel shift. */
const PARALLEL = 'parallel'

interface RateSensitivityPanelProps {
  request: BondPriceRequestDto | null
}

/**
 * Screen 16, rate sensitivity: the clean price for shifts of ±25, ±50 and ±100 bp, its change in
 * points and the dirty price's in percent, rises in green, falls in red; the price itself
 * highlighted. With one yield, the yield shifts; from a curve or rates entered, every rate
 * (fifth version), or one tenor alone of a custom curve or of the tenors entered.
 */
export function RateSensitivityPanel({ request }: RateSensitivityPanelProps) {
  const { t } = useTranslation()
  const [tenor, setTenor] = useState<StandardTenor | null>(null)
  const base = useBondPrice(request).data
  const byTenor = base !== undefined && shocksByTenor(base.discount)
  const shock = byTenor ? tenor : null
  const mode = base ? modeKey(base.discount.mode) : 'yield'
  const shocked = request && shock ? { ...request, shockTenor: shock } : request

  return (
    <Panel
      title={t(`bondPricing.sensitivityTitles.${mode}`)}
      code="BP"
      // With the shock drop-down, the drop-down says which shock; the title keeps the room.
      options={
        !byTenor && (
          <span>
            {mode === 'yield' ? t('bondPricing.shockOnYield') : t('bondPricing.parallelShift')}
          </span>
        )
      }
      bodyClassName="flex flex-col"
    >
      {byTenor && (
        <div className="shrink-0 border-b px-2 py-1.5">
          <Select
            aria-label={t('bondPricing.shockLabel')}
            value={shock ?? PARALLEL}
            options={[
              { value: PARALLEL, label: t('bondPricing.parallelShift') },
              ...STANDARD_TENORS.map((value) => ({
                value,
                label: t('bondPricing.shockAt', {
                  tenor: t(`bondPricing.discount.tenors.${value}`),
                }),
              })),
            ]}
            onChange={(value) => setTenor(value === PARALLEL ? null : (value as StandardTenor))}
          />
        </div>
      )}
      <PricedView request={shocked}>
        {(data, stale) => <Shifts data={data} stale={stale} shock={shock} />}
      </PricedView>
    </Panel>
  )
}

function Shifts({
  data,
  stale,
  shock,
}: {
  data: BondPriceDto
  stale: boolean
  shock: StandardTenor | null
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const mode = modeKey(data.discount.mode)
  const note =
    mode === 'yield'
      ? t('bondPricing.sensitivityNote')
      : shock
        ? t('bondPricing.sensitivityNotes.tenor', {
            tenor: t(`bondPricing.discount.tenors.${shock}`),
          })
        : [
            t(`bondPricing.sensitivityNotes.${mode}`),
            shocksByTenor(data.discount)
              ? t('bondPricing.sensitivityNotes.byTenor')
              : mode === 'rates' && t('bondPricing.sensitivityNotes.onceSaved'),
          ]
            .filter(Boolean)
            .join(' ')
  const tone = (value: number) => (value > 0 ? 'text-up' : value < 0 ? 'text-down' : 'text-primary')
  const header = 'h-row px-2 font-sans text-data font-normal text-secondary'

  return (
    <ScrollArea className={clsx('min-h-0 flex-1', stale && 'opacity-60')}>
      <table className="w-full border-collapse font-mono text-data tabular-nums">
        <caption className="sr-only">{t(`bondPricing.sensitivityTitles.${mode}`)}</caption>
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
      <p className="px-2 py-2 font-sans text-title text-secondary">{note}</p>
    </ScrollArea>
  )
}
