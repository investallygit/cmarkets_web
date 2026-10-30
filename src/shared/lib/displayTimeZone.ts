import { create } from 'zustand'
import { isTimeZone, MARKET_TIME_ZONE } from './format'

interface DisplayTimeZone {
  timeZone: string
}

/**
 * The time zone dates and times are shown in: the user's, from their profile (CFG), Douala until
 * it is known. The session clock and the market's own days stay in Douala time.
 */
export const useDisplayTimeZone = create<DisplayTimeZone>(() => ({ timeZone: MARKET_TIME_ZONE }))

export function setDisplayTimeZone(timeZone: string): void {
  useDisplayTimeZone.setState({ timeZone: isTimeZone(timeZone) ? timeZone : MARKET_TIME_ZONE })
}
