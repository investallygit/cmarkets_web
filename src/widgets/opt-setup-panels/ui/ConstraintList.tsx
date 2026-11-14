import { Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  editSetup,
  setGroup,
  updateItem,
  useOptEstimates,
  useOptimizer,
  useOptimizerTexts,
} from '@/entities/optimizer'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { AddConstraintForm, type ConstraintKeys } from './AddConstraintForm'

interface Row {
  id: string
  label: string
  value: number | null
  onChange: (value: number | null) => void
  onRemove: () => void
}

/**
 * Panel 2's constraints (spec screen 28): the whole capital invested and no short sale, which
 * every allocation keeps; the maximum of every security; each security's own bounds; the totals
 * per class, country or currency; "+ Add a constraint".
 */
export function ConstraintList() {
  const { t } = useTranslation()
  const texts = useOptimizerTexts()
  const setup = useOptimizer((state) => state.setup)
  const ids = useMemo(() => setup.universe.map((item) => item.securityId), [setup.universe])
  const estimates = useOptEstimates(ids, setup.history, setup.frequency)
  const [adding, setAdding] = useState(false)

  const keys: ConstraintKeys = useMemo(() => {
    const securities = estimates.data?.securities ?? []
    const unique = (values: string[]) => [...new Set(values)]
    return {
      security: ids,
      assetClass: unique(securities.map((security) => security.assetClass)),
      country: unique(
        securities
          .map((security) =>
            security.geography ? `etf:${security.geography}` : (security.country ?? ''),
          )
          .filter(Boolean),
      ),
      currency: unique(securities.map((security) => security.currency)),
    }
  }, [estimates.data, ids])

  const rows: Row[] = [
    ...setup.universe.flatMap((item) => {
      const code = texts.code(item.securityId)
      const own: Row[] = []
      if (item.maxWeightPct !== null)
        own.push({
          id: `${item.securityId}:max`,
          label: t('opt.objective.securityMax', { code }),
          value: item.maxWeightPct,
          onChange: (value) =>
            editSetup((current) => updateItem(current, item.securityId, { maxWeightPct: value })),
          onRemove: () =>
            editSetup((current) => updateItem(current, item.securityId, { maxWeightPct: null })),
        })
      if (item.minWeightPct !== null && item.minWeightPct > 0)
        own.push({
          id: `${item.securityId}:min`,
          label: t('opt.objective.securityMin', { code }),
          value: item.minWeightPct,
          onChange: (value) =>
            editSetup((current) => updateItem(current, item.securityId, { minWeightPct: value })),
          onRemove: () =>
            editSetup((current) => updateItem(current, item.securityId, { minWeightPct: null })),
        })
      return own
    }),
    ...setup.groups.flatMap((group) => {
      const name = texts.group(group.scope, group.key)
      const bound = (side: 'min' | 'max'): Row => ({
        id: `${group.scope}:${group.key}:${side}`,
        label: t(side === 'max' ? 'opt.objective.groupMax' : 'opt.objective.groupMin', {
          group: name,
        }),
        value: side === 'max' ? group.maxPct : group.minPct,
        onChange: (value) =>
          editSetup((current) =>
            setGroup(
              current,
              group.scope,
              group.key,
              side === 'max'
                ? { minPct: group.minPct, maxPct: value }
                : { minPct: value, maxPct: group.maxPct },
            ),
          ),
        onRemove: () =>
          editSetup((current) =>
            setGroup(
              current,
              group.scope,
              group.key,
              side === 'max'
                ? { minPct: group.minPct, maxPct: null }
                : { minPct: null, maxPct: group.maxPct },
            ),
          ),
      })
      return [
        ...(group.maxPct !== null ? [bound('max')] : []),
        ...(group.minPct !== null ? [bound('min')] : []),
      ]
    }),
  ]

  return (
    <section>
      <h3 className="mb-1 font-semibold tracking-wide text-accent-amber uppercase">
        {t('opt.objective.constraintsHeading')}
      </h3>
      <ul className="space-y-1">
        <li className="flex min-h-6 items-center justify-between gap-2">
          <span>{t('opt.objective.totalInvested')}</span>
          <span className="w-24 border bg-app px-2 text-right font-mono">100%</span>
        </li>
        <li className="flex min-h-6 items-center justify-between gap-2">
          <span>{t('opt.objective.shortSelling')}</span>
          <span className="w-24 border bg-app px-2 text-right">
            {t('opt.objective.notAllowed')}
          </span>
        </li>
        <li className="flex min-h-6 items-center justify-between gap-2">
          <span>{t('opt.objective.maxWeight')}</span>
          <NumberInput
            value={setup.maxWeightPct}
            onChange={(maxWeightPct) => editSetup((current) => ({ ...current, maxWeightPct }))}
            suffix="%"
            aria-label={t('opt.objective.maxWeight')}
            className="w-24"
          />
        </li>
        {rows.map((row) => (
          <li key={row.id} className="flex min-h-6 items-center justify-between gap-2">
            <span className="min-w-0 flex-1 truncate">{row.label}</span>
            <NumberInput
              value={row.value}
              onChange={row.onChange}
              suffix="%"
              aria-label={row.label}
              className="w-24"
              highlight
            />
            <button
              type="button"
              onClick={row.onRemove}
              aria-label={t('opt.objective.removeConstraint', { name: row.label })}
              className="inline-flex size-6 items-center justify-center text-secondary outline-none hover:text-down focus-visible:ring-1 focus-visible:ring-accent-amber"
            >
              <X size={14} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {adding ? (
        <AddConstraintForm keys={keys} onDone={() => setAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={ids.length === 0}
          className="mt-1 inline-flex min-h-6 items-center gap-1 text-info outline-none hover:underline focus-visible:ring-1 focus-visible:ring-accent-amber disabled:text-secondary"
        >
          <Plus size={12} aria-hidden />
          {t('opt.objective.addConstraint')}
        </button>
      )}
    </section>
  )
}
