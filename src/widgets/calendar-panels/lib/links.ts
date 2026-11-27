import type { CalendarEventDto } from '@/shared/api/contracts'
import { auctionsPath, routes, securityPath } from '@/shared/routes/paths'

/** The screen an event opens on a double click (screen 32): AUC, the security's profile, BEAC. */
export type CalendarLinkKind = 'auction' | 'security' | 'beac'

export function linkOf(event: CalendarEventDto): { kind: CalendarLinkKind; path: string } | null {
  switch (event.type) {
    case 'auction':
    case 'result':
      return { kind: 'auction', path: auctionsPath(event.country ?? undefined) }
    case 'beac':
    case 'statistic':
      return { kind: 'beac', path: routes.beac }
    case 'international':
      return null
    default:
      return event.securityId ? { kind: 'security', path: securityPath(event.securityId) } : null
  }
}
