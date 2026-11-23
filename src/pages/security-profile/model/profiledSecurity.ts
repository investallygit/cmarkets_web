import { useCommodities } from '@/entities/commodity'
import type { SecurityProfileDto } from '@/shared/api/contracts'

/** A commodity known by the list beside its profile, before GET /securities/{id} answers. */
export interface ListedCommodity {
  id: string
  code: string
  type: 'commodity'
}

/** What a profile's tabs know of their security. */
export type ProfiledSecurity = SecurityProfileDto | ListedCommodity

/**
 * The series of CMDTY's list an address names, once the list is on the screen (it is not asked for
 * here): another series picked in it then opens beside the list, which stays.
 */
export function useListedCommodity(id: string): ListedCommodity | null {
  const { data } = useCommodities({ enabled: false })
  return data?.some((item) => item.code === id) ? { id, code: id, type: 'commodity' } : null
}
