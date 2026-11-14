import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OPT_CLASS_COLOR, useOptimizerTexts } from '@/entities/optimizer'
import type {
  OptAssetClass,
  OptBreakdownItemDto,
  OptGroupScope,
  OptResultDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { ScrollArea } from '@/shared/ui/ScrollArea'

type Second = 'country' | 'currency'

/**
 * Screen 29's breakdown: by asset class, with the limits set, then by country (an ETF's market) or
 * by currency.
 */
export function BreakdownPanel({ result }: { result: OptResultDto }) {
  const { t } = useTranslation()
  const [second, setSecond] = useState<Second>('country')
  return (
    <Panel
      title={t('opt.breakdown.title')}
      code="OPT RES"
      options={
        <PanelTabs<Second>
          value={second}
          options={[
            { value: 'country', label: t('opt.breakdown.byCountry') },
            { value: 'currency', label: t('opt.breakdown.byCurrency') },
          ]}
          onChange={setSecond}
        />
      }
    >
      <ScrollArea className="h-full">
        <div className="space-y-3 p-2">
          <Bars
            heading={t('opt.breakdown.byClass')}
            scope="assetClass"
            items={result.breakdown.assetClass}
          />
          <Bars
            heading={
              second === 'country' ? t('opt.breakdown.byCountry') : t('opt.breakdown.byCurrency')
            }
            scope={second}
            items={second === 'country' ? result.breakdown.country : result.breakdown.currency}
          />
        </div>
      </ScrollArea>
    </Panel>
  )
}

function Bars({
  heading,
  scope,
  items,
}: {
  heading: string
  scope: OptGroupScope
  items: readonly OptBreakdownItemDto[]
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const texts = useOptimizerTexts()
  const widest = Math.max(...items.map((item) => item.weightPct), 1)
  return (
    <section>
      <h3 className="mb-1 font-sans text-data font-semibold tracking-wide text-accent-amber uppercase">
        {heading}
      </h3>
      <ul className="space-y-1 font-sans text-data">
        {items.map((item) => {
          const color =
            scope === 'assetClass'
              ? OPT_CLASS_COLOR[item.key as OptAssetClass]
              : 'var(--accent-amber)'
          const limits = [
            item.minPct !== null
              ? t('opt.breakdown.min', { value: format.percent(item.minPct, 0, false) })
              : null,
            item.maxPct !== null
              ? t('opt.breakdown.max', { value: format.percent(item.maxPct, 0, false) })
              : null,
          ].filter(Boolean)
          return (
            <li key={item.key} className="grid grid-cols-[7rem_1fr_4rem_4.5rem] items-center gap-2">
              <span className="truncate text-primary">{texts.group(scope, item.key)}</span>
              <span
                aria-hidden
                className="h-3"
                style={{
                  width: `${(item.weightPct / widest) * 100}%`,
                  backgroundColor: color,
                  opacity: scope === 'assetClass' ? 1 : 0.7,
                }}
              />
              <span className="text-right font-mono tabular-nums">
                {format.percent(item.weightPct, 1, false)}
              </span>
              <span className="font-mono text-label text-secondary">{limits.join(' · ')}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
