import { usePortfolios } from '@/entities/portfolio'
import { useCurrentUser } from '@/entities/session'

/**
 * The portfolios the account type may hold (spec section 12): 3 simulated ones for a Student,
 * 5 for an Analyst or a Trader, no limit for a Portfolio manager.
 */
export function usePortfolioQuota() {
  const user = useCurrentUser()
  // The portfolios colleagues share are read, not held.
  const used = usePortfolios().data?.filter((portfolio) => portfolio.sharedBy === null).length ?? 0
  const quota = user.quotas.portfolios
  return {
    quota,
    used,
    reached: quota !== null && used >= quota,
    /** A Student only simulates allocations. */
    modelOnly: user.accountType === 'student',
    canWrite: user.permissions.includes('portfolios:write'),
  }
}
