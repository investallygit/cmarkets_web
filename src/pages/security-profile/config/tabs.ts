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
}
