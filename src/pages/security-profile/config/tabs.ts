import type { Permission } from '@/shared/api/contracts'
import type { SecurityFunction } from '@/shared/routes/paths'

/** Command bar code of each tab (spec section 8). */
export const TAB_CODES: Record<SecurityFunction, string> = {
  des: 'DES',
  gp: 'GP',
  fa: 'FA',
  dvd: 'DVD',
  n: 'N',
  doc: 'DOC',
  hds: 'HDS',
  ana: 'ANA',
  bp: 'BP',
  cf: 'CF',
  rat: 'RAT',
  hld: 'HLD',
  perf: 'PERF',
  dist: 'DIST',
  cmp: 'CMP',
}

/**
 * The tabs whose figures need a permission beyond the market's: the menu's rule, which the API
 * applies (403). An account without it (the SVT) is not offered them (B21).
 */
export const TAB_PERMISSIONS: Partial<Record<SecurityFunction, Permission>> = {
  fa: 'analysis:read',
  bp: 'analysis:read',
  ana: 'research:read',
}
