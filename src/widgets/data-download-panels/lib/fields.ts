/** The fields of DL's datasets the screen names (screen 30); the API may add more, named by code. */
export const EXPORT_FIELDS = [
  'date',
  'open',
  'high',
  'low',
  'close',
  'volume',
  'valueTraded',
  'changePct',
  'currency',
  'priceXaf',
  'cleanPrice',
  'dirtyPrice',
  'accrued',
  'ytm',
  'ytw',
  'macaulayDuration',
  'modifiedDuration',
  'spreadBp',
  'priceType',
  'country',
  'tenor',
  'yieldPct',
  'source',
  'xafRate',
  'ecbRate',
  'name',
  'value',
  'unit',
] as const
export type ExportField = (typeof EXPORT_FIELDS)[number]

export function isExportField(field: string): field is ExportField {
  return (EXPORT_FIELDS as readonly string[]).includes(field)
}

/** Decimals a preview shows of a field: whole numbers, rates to four, the rest to two. */
export function decimalsOf(field: string): number {
  if (field === 'volume' || field === 'valueTraded' || field === 'spreadBp') return 0
  if (field === 'xafRate' || field === 'ecbRate') return 4
  return 2
}
