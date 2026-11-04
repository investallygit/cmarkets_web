import { usePortfolios } from '@/entities/portfolio'
import { useCurrentUser } from '@/entities/session'

/**
 * What the user may do with a portfolio: change it and generate its reports when it is theirs and
 * the account type allows it. A colleague's portfolio shared with the organisation is only read,
 * as a CEO reads the organisation's (spec section 12).
 */
export function usePortfolioAccess(portfolioId: string | undefined) {
  const { permissions } = useCurrentUser()
  const portfolio = usePortfolios().data?.find((candidate) => candidate.id === portfolioId)
  const own = portfolio !== undefined && portfolio.sharedBy === null
  return {
    canWrite: own && permissions.includes('portfolios:write'),
    canReport: own && permissions.includes('portfolios:reports'),
    /** The colleague who shares the portfolio; null for the user's own. */
    sharedBy: portfolio?.sharedBy ?? null,
  }
}
