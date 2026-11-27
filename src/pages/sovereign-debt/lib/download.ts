import type { DebtSecuritiesDto } from '@/shared/api/contracts'
import type { CsvCell } from '@/shared/lib/csv'

/**
 * DEBT's Download (screen 35): the securities outstanding of the country shown, one a row, the
 * amounts in XAF and the rates in percent, as the API gives them, for a spreadsheet.
 */
export function securitiesRows(data: DebtSecuritiesDto): CsvCell[][] {
  return [
    [
      'as_of',
      'country',
      'security',
      'type',
      'issue_date',
      'maturity_date',
      'outstanding_xaf',
      'rate_pct',
      'yield_pct',
      'years_left',
    ],
    ...data.items.map((item) => [
      data.asOf,
      item.country,
      item.code,
      item.instrument.toUpperCase(),
      item.issueDate,
      item.maturityDate,
      item.outstanding,
      item.ratePct,
      item.yieldPct,
      item.yearsLeft,
    ]),
  ]
}
