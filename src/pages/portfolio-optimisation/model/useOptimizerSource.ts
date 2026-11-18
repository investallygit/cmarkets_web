import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useImportUniverse } from '@/features/import-opt-universe'
import { openScenario, useOptimizer, useOptScenario } from '@/entities/optimizer'
import { isApiError } from '@/shared/api'
import { toast } from '@/shared/ui/toast'

/**
 * What OPT opens with (spec screen 28: "Access: OPT code, 'Optimise' button on the Portfolio screen
 * or on a watchlist"): ?portfolio= or ?watchlist= start a new setup with their securities, once;
 * ?scenario= opens a saved scenario.
 */
export function useOptimizerSource() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const { fromPortfolio, fromWatchlist } = useImportUniverse()
  const portfolio = params.get('portfolio')
  const watchlist = params.get('watchlist')
  const scenarioId = params.get('scenario')
  const scenario = useOptScenario(scenarioId)
  const taken = useRef<string | null>(null)

  useEffect(() => {
    const source = portfolio
      ? `portfolio:${portfolio}`
      : watchlist
        ? `watchlist:${watchlist}`
        : null
    if (!source || taken.current === source) return
    taken.current = source
    void (
      portfolio
        ? fromPortfolio(portfolio, { fresh: true })
        : fromWatchlist(watchlist ?? '', { fresh: true })
    ).then(() => setParams({}, { replace: true }))
  }, [portfolio, watchlist, fromPortfolio, fromWatchlist, setParams])

  useEffect(() => {
    if (!scenario.data) return
    const open = useOptimizer.getState().scenario
    if (open?.id === scenario.data.id && open.version === scenario.data.version) return
    openScenario(scenario.data)
  }, [scenario.data])

  useEffect(() => {
    if (!scenario.error) return
    // An unknown id is said in the user's words, not as the problem's title "Not Found" (B61).
    const message = isApiError(scenario.error, 404)
      ? t('opt.scenario.notFound')
      : scenario.error.message
    toast.error(t('opt.scenario.openFailed', { message }))
  }, [scenario.error, t])
}
