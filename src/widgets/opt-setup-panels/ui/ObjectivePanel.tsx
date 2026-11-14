import { useTranslation } from 'react-i18next'
import { OptimiseButton } from '@/features/run-optimization'
import {
  editSetup,
  hasTarget,
  OPT_FREQUENCIES,
  OPT_HISTORIES,
  OPT_OBJECTIVES,
  useCurrentCheck,
  useOptimizer,
} from '@/entities/optimizer'
import { usePortfolios } from '@/entities/portfolio'
import type { OptFrequency, OptHistory } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Select } from '@/shared/ui/form/Select'
import { Panel } from '@/shared/ui/Panel'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { ConstraintList } from './ConstraintList'

/**
 * Screen 28, panel 2: one of the four objectives of spec section 14.6 with its target, the
 * constraints, the capital, the history of the estimates, the risk-free rate and the portfolio to
 * compare with; OPTIMISE once the check finds nothing that stops the run.
 */
export function ObjectivePanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const setup = useOptimizer((state) => state.setup)
  const { check, settled } = useCurrentCheck()
  const portfolios = usePortfolios()
  const adminRate = check.data?.riskFreeRatePct

  return (
    <Panel title={`2 · ${t('opt.objective.title')}`} code="OPT">
      <div className="flex h-full flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-3 p-2 font-sans text-data">
            <fieldset>
              <legend className="mb-1 font-semibold tracking-wide text-accent-amber uppercase">
                {t('opt.objective.heading')}
              </legend>
              <div className="space-y-1">
                {OPT_OBJECTIVES.map((objective) => {
                  const selected = setup.objective === objective
                  return (
                    <div
                      key={objective}
                      className={`flex min-h-9 items-center gap-2 border px-2 ${selected ? 'border-accent-amber/60 bg-selected' : ''}`}
                    >
                      <label className="flex flex-1 cursor-pointer items-center gap-2 py-1">
                        <input
                          type="radio"
                          name="opt-objective"
                          checked={selected}
                          onChange={() => editSetup((current) => ({ ...current, objective }))}
                          className="size-4 accent-[var(--accent-amber)]"
                        />
                        {t(`opt.objectives.${objective}`)}
                      </label>
                      {hasTarget(objective) && (
                        <NumberInput
                          value={selected ? setup.targetPct : null}
                          disabled={!selected}
                          onChange={(targetPct) =>
                            editSetup((current) => ({ ...current, targetPct }))
                          }
                          suffix="%"
                          highlight={selected}
                          aria-label={t(
                            `opt.objective.target.${objective === 'minRiskForReturn' ? 'minRiskForReturn' : 'maxReturnForRisk'}`,
                          )}
                          className="w-24"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </fieldset>

            <ConstraintList />

            <section>
              <h3 className="mb-1 font-semibold tracking-wide text-accent-amber uppercase">
                {t('opt.objective.settingsHeading')}
              </h3>
              <dl className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1">
                <dt className="text-secondary">{t('opt.objective.capital')}</dt>
                <dd>
                  <NumberInput
                    value={setup.capital}
                    decimals={0}
                    onChange={(capital) =>
                      editSetup((current) => ({ ...current, capital: capital ?? 0 }))
                    }
                    suffix="XAF"
                    aria-label={t('opt.objective.capital')}
                    className="w-44"
                  />
                </dd>
                <dt className="text-secondary">{t('opt.objective.history')}</dt>
                <dd className="flex gap-1">
                  <Select<OptHistory>
                    value={setup.history}
                    options={OPT_HISTORIES.map((value) => ({
                      value,
                      label: t(`opt.objective.histories.${value}`),
                    }))}
                    onChange={(history) => editSetup((current) => ({ ...current, history }))}
                    aria-label={t('opt.objective.history')}
                  />
                  <Select<OptFrequency>
                    value={setup.frequency}
                    options={OPT_FREQUENCIES.map((value) => ({
                      value,
                      label: t(`opt.objective.frequencies.${value}`),
                    }))}
                    onChange={(frequency) => editSetup((current) => ({ ...current, frequency }))}
                    aria-label={t('opt.objective.frequency')}
                  />
                </dd>
                <dt className="text-secondary">{t('opt.objective.riskFree')}</dt>
                <dd>
                  <NumberInput
                    value={setup.riskFreeRatePct}
                    onChange={(riskFreeRatePct) =>
                      editSetup((current) => ({ ...current, riskFreeRatePct }))
                    }
                    suffix="%"
                    highlight={setup.riskFreeRatePct !== null}
                    placeholder={
                      adminRate === undefined
                        ? undefined
                        : t('opt.objective.riskFreeDefault', {
                            rate: format.percent(adminRate, 2, false),
                          })
                    }
                    aria-label={t('opt.objective.riskFree')}
                    className="w-44"
                  />
                </dd>
                <dt className="text-secondary">{t('opt.objective.compare')}</dt>
                <dd>
                  <Select<string>
                    value={setup.comparePortfolioId ?? ''}
                    options={[
                      { value: '', label: t('opt.objective.compareNone') },
                      ...(portfolios.data ?? []).map((portfolio) => ({
                        value: portfolio.id,
                        label: portfolio.name,
                      })),
                    ]}
                    onChange={(id) =>
                      editSetup((current) => ({ ...current, comparePortfolioId: id || null }))
                    }
                    aria-label={t('opt.objective.compare')}
                    className="w-44"
                  />
                </dd>
              </dl>
            </section>
          </div>
        </ScrollArea>
        <div className="shrink-0 border-t p-2">
          <OptimiseButton ready={settled && check.data?.feasible === true} />
        </div>
      </div>
    </Panel>
  )
}
