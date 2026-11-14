import type { MeDto } from '@/shared/api/contracts'

/**
 * Holds a key of the RFQ: a Trader's or a Manager's (rfq:trade), an SVT's (svt:approve), a reader of
 * its organisation's requests, its CEO among them (rfq:read). The server takes them away while the
 * RFQ is off (ROADMAP decision 24), which closes its hub too.
 */
export function holdsRfqKey(user: Pick<MeDto, 'permissions'>): boolean {
  return (['rfq:trade', 'svt:approve', 'rfq:read'] as const).some((key) =>
    user.permissions.includes(key),
  )
}
