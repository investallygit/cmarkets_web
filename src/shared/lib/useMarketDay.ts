import { toMarketDay } from './format'
import { useNow } from './useNow'

/** Today in Douala time as an ISO date, such as "2026-10-30"; checked every minute. */
export function useMarketDay(): string {
  return toMarketDay(useNow(60_000))
}
