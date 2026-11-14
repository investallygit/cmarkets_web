import type { MeDto } from '@/shared/api/contracts'

/**
 * Holds a key of the RFQ: a Trader's or a Manager's (rfq:trade), an SVT's (svt:approve). The server
 * takes them away while the RFQ is off (ROADMAP decision 24), which closes its hub too.
 */
export function holdsRfqKey(user: Pick<MeDto, 'permissions'>): boolean {
  return user.permissions.includes('rfq:trade') || user.permissions.includes('svt:approve')
}
