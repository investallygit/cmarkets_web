import { AlertTriangle, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImportUniverseButtons } from '@/features/import-opt-universe'
import {
  addLabels,
  addSecurities,
  editSetup,
  OPT_CLASS_COLOR,
  OPT_MAX_SECURITIES,
  removeSecurity,
  updateItem,
  useOptEstimates,
  useOptimizer,
} from '@/entities/optimizer'
import { SecurityPicker } from '@/entities/security'
import type { OptSecurityEstimateDto, OptUniverseItemDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Panel } from '@/shared/ui/Panel'
import { ScrollArea } from '@/shared/ui/ScrollArea'

type Figure = 'expectedReturnPct' | 'volatilityPct' | 'minWeightPct' | 'maxWeightPct'

const FIGURES: readonly {
  key: Figure
  label: 'expectedReturn' | 'volatility' | 'minWeight' | 'maxWeight'
}[] = [
  { key: 'expectedReturnPct', label: 'expectedReturn' },
  { key: 'volatilityPct', label: 'volatility' },
  { key: 'minWeightPct', label: 'minWeight' },
  { key: 'maxWeightPct', label: 'maxWeight' },
]

/**
 * Screen 28, panel 1: the universe, 2 to 20 equities, bonds and ETFs searched or taken from a
 * portfolio or a watchlist; each with its type, its expected return and volatility (the estimate
 * shown, a value entered replaces it) and its weight's bounds (API /optimizer/estimates).
 */
export function UniversePanel() {
  const { t } = useTranslation()
  const setup = useOptimizer((state) => state.setup)
  const labels = useOptimizer((state) => state.labels)
  const ids = useMemo(() => setup.universe.map((item) => item.securityId), [setup.universe])
  const estimates = useOptEstimates(ids, setup.history, setup.frequency)
  const byId = useMemo(
    () =>
      new Map(
        (estimates.data?.securities ?? []).map((security) => [security.securityId, security]),
      ),
    [estimates.data],
  )
  const [adding, setAdding] = useState(false)
  const full = setup.universe.length >= OPT_MAX_SECURITIES
  const history = t(`opt.objective.histories.${setup.history}`)

  return (
    <Panel
      title={`1 · ${t('opt.universe.title')}`}
      code="OPT"
      // The bar's own options, so that on a phone those that do not fit go to its next line.
      options={
        <>
          <ButtonLike
            disabled={full}
            onClick={() => setAdding(true)}
            label={t('opt.universe.add')}
          />
          <ImportUniverseButtons />
        </>
      }
    >
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b p-2">
          {full ? (
            <p className="font-sans text-data text-warning">{t('opt.universe.full')}</p>
          ) : (
            <SecurityPicker
              autoFocus={adding}
              types={['equity', 'bond', 'etf']}
              exclude={new Set(ids)}
              placeholder={t('opt.universe.search')}
              aria-label={t('opt.universe.searchLabel')}
              onEscape={() => setAdding(false)}
              onSelect={(security) => {
                addLabels({
                  [security.id]: {
                    code: security.code,
                    name: security.name,
                    assetClass:
                      security.type === 'equity' ||
                      security.type === 'bond' ||
                      security.type === 'etf'
                        ? security.type
                        : null,
                  },
                })
                editSetup((current) => addSecurities(current, [security.id]))
              }}
              className="w-full"
            />
          )}
        </div>
        <ScrollArea className="min-h-0 flex-1">
          {setup.universe.length === 0 ? (
            <p className="p-3 font-sans text-data text-secondary">{t('opt.universe.empty')}</p>
          ) : (
            <table className="w-full border-collapse font-mono text-data tabular-nums">
              <thead className="sticky top-0 bg-panel-header font-sans text-secondary">
                <tr>
                  <th scope="col" className="px-2 py-1 text-left font-normal">
                    {t('opt.universe.columns.security')}
                  </th>
                  <th scope="col" className="px-2 py-1 text-left font-normal">
                    {t('opt.universe.columns.type')}
                  </th>
                  {FIGURES.map((figure) => (
                    <th key={figure.key} scope="col" className="px-1 py-1 text-right font-normal">
                      {t(`opt.universe.columns.${figure.label}`)}
                    </th>
                  ))}
                  <th scope="col" className="w-7 px-1">
                    <span className="sr-only">{t('opt.universe.remove', { code: '' })}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {setup.universe.map((item, index) => (
                  <UniverseRow
                    key={item.securityId}
                    item={item}
                    estimate={byId.get(item.securityId)}
                    code={
                      byId.get(item.securityId)?.code ??
                      labels[item.securityId]?.code ??
                      item.securityId
                    }
                    assetClass={
                      byId.get(item.securityId)?.assetClass ??
                      labels[item.securityId]?.assetClass ??
                      null
                    }
                    defaultMax={setup.maxWeightPct}
                    striped={index % 2 === 1}
                  />
                ))}
              </tbody>
            </table>
          )}
          <EstimateSources
            history={history}
            frequency={t(`opt.objective.frequencies.${setup.frequency}`)}
          />
        </ScrollArea>
        <p className="shrink-0 border-t px-2 py-1 font-sans text-label text-secondary">
          {t('opt.universe.count', { count: setup.universe.length })}
        </p>
      </div>
    </Panel>
  )
}

interface UniverseRowProps {
  item: OptUniverseItemDto
  estimate: OptSecurityEstimateDto | undefined
  code: string
  assetClass: OptSecurityEstimateDto['assetClass'] | null
  defaultMax: number | null
  striped: boolean
}

function UniverseRow({ item, estimate, code, assetClass, defaultMax, striped }: UniverseRowProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const flags = estimate?.flags ?? []
  const warn = flags.filter(
    (flag) => flag === 'shortHistory' || flag === 'illiquid' || flag === 'noPrice',
  )
  const estimated: Record<Figure, number | null> = {
    expectedReturnPct: estimate?.expectedReturnPct ?? null,
    volatilityPct: estimate?.volatilityPct ?? null,
    minWeightPct: 0,
    maxWeightPct: defaultMax,
  }
  return (
    <tr className={striped ? 'bg-row-alt' : undefined}>
      <th scope="row" className="px-2 py-0.5 text-left font-normal text-accent-amber">
        <span className="inline-flex items-center gap-1" title={estimate?.name}>
          {code}
          {warn.length > 0 && (
            <span
              className="text-warning"
              title={warn.map((flag) => t(`opt.universe.flags.${flag}`)).join(' · ')}
            >
              <AlertTriangle size={12} aria-hidden />
              <span className="sr-only">
                {warn.map((flag) => t(`opt.universe.flags.${flag}`)).join(' · ')}
              </span>
            </span>
          )}
        </span>
      </th>
      <td
        className="px-2 py-0.5 font-sans"
        style={assetClass ? { color: OPT_CLASS_COLOR[assetClass] } : undefined}
      >
        {assetClass ? t(`opt.classes.${assetClass}`) : '—'}
      </td>
      {FIGURES.map((figure) => {
        const entered = item[figure.key]
        const fallback = estimated[figure.key]
        const label = t(`opt.universe.columns.${figure.label}`)
        return (
          <td key={figure.key} className="px-1 py-0.5">
            <NumberInput
              value={entered}
              onChange={(value) =>
                editSetup((setup) => updateItem(setup, item.securityId, { [figure.key]: value }))
              }
              decimals={figure.key === 'volatilityPct' ? 1 : 2}
              highlight={entered !== null}
              placeholder={
                fallback === null
                  ? '—'
                  : format.number(fallback, figure.key === 'volatilityPct' ? 1 : 2)
              }
              title={
                entered === null
                  ? fallback === null &&
                    figure.key !== 'minWeightPct' &&
                    figure.key !== 'maxWeightPct'
                    ? t('opt.universe.noEstimate')
                    : undefined
                  : fallback !== null &&
                      (figure.key === 'expectedReturnPct' || figure.key === 'volatilityPct')
                    ? t('opt.universe.estimate', { value: format.number(fallback, 2) })
                    : undefined
              }
              aria-label={t('opt.universe.fieldLabel', { field: label, code })}
              className="w-20"
            />
          </td>
        )
      })}
      <td className="px-1 py-0.5 text-center">
        <button
          type="button"
          onClick={() => editSetup((setup) => removeSecurity(setup, item.securityId))}
          aria-label={t('opt.universe.remove', { code })}
          className="inline-flex size-6 items-center justify-center text-secondary outline-none hover:text-down focus-visible:ring-1 focus-visible:ring-accent-amber"
        >
          <X size={14} aria-hidden />
        </button>
      </td>
    </tr>
  )
}

function EstimateSources({ history, frequency }: { history: string; frequency: string }) {
  const { t } = useTranslation()
  return (
    <section className="p-3 font-sans text-data text-primary">
      <h3 className="mb-1 font-semibold tracking-wide text-accent-amber uppercase">
        {t('opt.universe.sourcesTitle')}
      </h3>
      <ul className="space-y-0.5 text-secondary">
        <li>· {t('opt.universe.sourceEquities', { history, frequency })}</li>
        <li>· {t('opt.universe.sourceBonds', { history })}</li>
        <li>· {t('opt.universe.sourceForeign')}</li>
        <li>· {t('opt.universe.sourceEdited')}</li>
        <li>· {t('opt.universe.sourceShort')}</li>
      </ul>
    </section>
  )
}

function ButtonLike({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-6 items-center gap-1 px-1 font-sans text-data text-info outline-none hover:underline focus-visible:ring-1 focus-visible:ring-accent-amber disabled:text-secondary"
    >
      <Plus size={12} aria-hidden />
      {label}
    </button>
  )
}
