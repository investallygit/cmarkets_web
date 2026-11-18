import { RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { ScreenWorkspace } from '@/features/workspace-layout'
import {
  editSetup,
  isResultStale,
  openScenario,
  showResult,
  useFrontierPoint,
  useOptimizer,
  useOptimizerTexts,
  useSaveScenario,
} from '@/entities/optimizer'
import { useFormat } from '@/shared/i18n'
import { routes } from '@/shared/routes/paths'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'
import {
  AllocationPanel,
  BreakdownPanel,
  ComparisonPanel,
  FrontierPanel,
  IndicatorTiles,
  NextStepsPanel,
} from '@/widgets/opt-result-panels'
import { OPT_RESULT_LAYOUT } from '../config/layout'
import { useOptimizerSource } from '../model/useOptimizerSource'
import { OptimisationTabs } from './OptimisationTabs'

/**
 * Screen 29, OPT RES (spec section 9): the objective computed, its indicators, the allocation, the
 * efficient frontier (a click computes another point), the breakdown, the binding constraints and
 * the comparison, the next steps. A saved scenario shows its data date and computes again on
 * today's data.
 */
export function OptimisationResultPage() {
  useOptimizerSource()
  const { t } = useTranslation()
  const format = useFormat()
  const texts = useOptimizerTexts()
  const result = useOptimizer((state) => state.result)
  const resultSetup = useOptimizer((state) => state.resultSetup)
  const scenario = useOptimizer((state) => state.scenario)
  const resultSaved = useOptimizer((state) => state.resultSaved)
  const stale = useOptimizer(isResultStale)
  const point = useFrontierPoint()
  const recompute = useSaveScenario()
  // A saved scenario's result keeps its id in the address: a reload opens it again (B60).
  const [params, setParams] = useSearchParams()
  const savedId = scenario && resultSaved ? scenario.id : null
  useEffect(() => {
    if (savedId && params.get('scenario') !== savedId)
      setParams({ scenario: savedId }, { replace: true })
  }, [savedId, params, setParams])

  if (!result || !resultSetup)
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 px-2 pt-2">
          <OptimisationTabs />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 font-sans text-data text-secondary">
          <p>{t('opt.result.empty')}</p>
          <Link to={routes.optimizer} className="text-info underline">
            {t('opt.result.toSetup')}
          </Link>
        </div>
      </div>
    )

  const pickPoint = (returnPct: number) => {
    const setup = { ...resultSetup, objective: 'minRiskForReturn' as const, targetPct: returnPct }
    point.mutate(
      { setup, returnPct },
      {
        onSuccess: (next) => {
          editSetup(() => setup)
          showResult(next, setup)
        },
        onError: (error) => toast.error(t('opt.frontier.failed', { message: error.message })),
      },
    )
  }

  const target = result.targetPct === null ? '' : texts.pct(result.targetPct)
  const summary = t('opt.result.summary', {
    objective: t(`opt.objectiveSummary.${result.objective}`, { target }),
    count: result.lines.length,
    constraints: result.constraintCount,
    // A run of a few milliseconds reads "0.03 s", or "< 0.01 s", rather than "0.0 s".
    seconds:
      result.durationMs < 10
        ? `< ${format.number(0.01, 2)}`
        : format.number(result.durationMs / 1000, result.durationMs < 1000 ? 2 : 1),
  })
  const panels = {
    allocation: <AllocationPanel result={result} />,
    frontier: <FrontierPanel result={result} onPick={pickPoint} picking={point.isPending} />,
    breakdown: <BreakdownPanel result={result} />,
    comparison: <ComparisonPanel result={result} />,
    nextSteps: <NextStepsPanel result={result} />,
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-2 px-2 pt-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <OptimisationTabs />
          <p className="font-sans text-data text-secondary">{summary}</p>
          <p className="font-sans text-data text-secondary">
            {t('opt.result.dataOf', { date: format.isoDate(result.dataDate) })}
          </p>
          {scenario && resultSaved && (
            <Button
              variant="link"
              size="sm"
              icon={RefreshCw}
              busy={recompute.isPending}
              onClick={() =>
                recompute.mutate(
                  {
                    id: scenario.id,
                    version: scenario.version,
                    name: scenario.name,
                    setup: resultSetup,
                  },
                  {
                    onSuccess: (saved) => {
                      openScenario(saved)
                      toast.success(t('opt.scenario.recomputed', { name: saved.name }))
                    },
                    onError: (error) =>
                      toast.error(t('opt.scenario.failed', { message: error.message })),
                  },
                )
              }
            >
              {t('opt.scenario.recompute')}
            </Button>
          )}
        </div>
        {stale && (
          <p role="status" className="font-sans text-data text-warning">
            {t('opt.result.stale')}
          </p>
        )}
        <IndicatorTiles indicators={result.indicators} />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace screenId="OPTRES" defaultLayout={OPT_RESULT_LAYOUT} panels={panels} />
      </div>
    </div>
  )
}
