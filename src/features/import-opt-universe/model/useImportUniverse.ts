import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  addLabels,
  addSecurities,
  editSetup,
  newSetup,
  OPT_MAX_SECURITIES,
  useOptimizer,
} from '@/entities/optimizer'
import { portfolioKeys } from '@/entities/portfolio'
import { watchlistKeys } from '@/entities/watchlist'
import type { OptAssetClass, SecurityType } from '@/shared/api/contracts'
import { portfoliosApi, watchlistsApi } from '@/shared/api/endpoints'
import { toast } from '@/shared/ui/toast'

interface ImportItem {
  securityId: string
  code: string
  name: string
  type: SecurityType
}

const classOf = (type: SecurityType): OptAssetClass | null =>
  type === 'equity' || type === 'bond' || type === 'etf' ? type : null

/**
 * The universe taken from a portfolio (its lines of today, and the portfolio as the one compared)
 * or from a watchlist (spec screen 28: "import from a portfolio or a watchlist"): its equities,
 * bonds and ETFs added, up to 20. `fresh` starts a new setup first: PORT's and a watchlist's
 * "Optimise".
 */
export function useImportUniverse() {
  const { t } = useTranslation()
  const client = useQueryClient()

  const take = useCallback(
    (items: readonly ImportItem[], name: string) => {
      const eligible = items.filter((item) => classOf(item.type) !== null)
      if (eligible.length === 0) {
        toast.error(t('opt.universe.importNone', { name }))
        return false
      }
      addLabels(
        Object.fromEntries(
          eligible.map((item) => [
            item.securityId,
            { code: item.code, name: item.name, assetClass: classOf(item.type) },
          ]),
        ),
      )
      const before = useOptimizer.getState().setup.universe.length
      editSetup((setup) =>
        addSecurities(
          setup,
          eligible.map((item) => item.securityId),
        ),
      )
      const added = useOptimizer.getState().setup.universe.length - before
      toast.success(t('opt.universe.imported', { count: added, name }))
      if (before + eligible.length > OPT_MAX_SECURITIES) toast.error(t('opt.universe.full'))
      return true
    },
    [t],
  )

  const fromPortfolio = useCallback(
    async (portfolioId: string, { fresh = false }: { fresh?: boolean } = {}) => {
      try {
        const [portfolios, positions] = await Promise.all([
          client.fetchQuery({
            queryKey: portfolioKeys.list(),
            queryFn: ({ signal }) => portfoliosApi.list(signal),
          }),
          client.fetchQuery({
            queryKey: portfolioKeys.positions(portfolioId),
            queryFn: ({ signal }) => portfoliosApi.positions(portfolioId, signal),
          }),
        ])
        const name = portfolios.find((portfolio) => portfolio.id === portfolioId)?.name ?? ''
        if (fresh) newSetup()
        if (take(positions.items, name))
          editSetup((setup) => ({ ...setup, comparePortfolioId: portfolioId }))
      } catch (error) {
        toast.error(t('opt.universe.importFailed', { message: (error as Error).message }))
      }
    },
    [client, t, take],
  )

  const fromWatchlist = useCallback(
    async (watchlistId: string, { fresh = false }: { fresh?: boolean } = {}) => {
      try {
        const lists = await client.fetchQuery({
          queryKey: watchlistKeys.all,
          queryFn: ({ signal }) => watchlistsApi.list(signal),
        })
        const list = lists.find((candidate) => candidate.id === watchlistId)
        if (!list) return
        if (fresh) newSetup()
        take(list.items, list.name)
      } catch (error) {
        toast.error(t('opt.universe.importFailed', { message: (error as Error).message }))
      }
    },
    [client, t, take],
  )

  return { fromPortfolio, fromWatchlist }
}
