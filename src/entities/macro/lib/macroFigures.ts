import type { MacroUnit } from '@/shared/api/contracts'
import { formatCompact, formatNumber, formatPercent, type Locale } from '@/shared/lib/format'

const NBSP = ' '

/** Where a figure stands: a tile writes its unit ("3.6%"); a table's row names it in its header ("3.6"). */
export type MacroFigureStyle = 'tile' | 'table'

/** Amounts in dollars from a billion are written short: "51.3 Bn". */
const COMPACT_FROM = 1e9

/** People are counted in millions from a million: "29.1 M", "1,240 M". */
const MILLION = 1e6

function dollars(text: string, locale: Locale): string {
  return locale === 'fr' ? `${text}${NBSP}$` : `$${text}`
}

/** A count of people: in millions from a million (one decimal below a billion), whole below. */
function people(value: number, locale: Locale): string {
  if (Math.abs(value) < MILLION) return formatNumber(value, locale, 0)
  const millions = value / MILLION
  return formatNumber(millions, locale, Math.abs(millions) < 1000 ? 1 : 0)
}

/**
 * A figure as screen 25 writes it: the tile with its unit ("3.6%", "$1,720", "29.1 M"), the table
 * bare under a row whose name gives the unit ("3.6", "1,720", "29.1").
 */
export function formatMacroFigure(
  value: number,
  unit: MacroUnit,
  locale: Locale,
  style: MacroFigureStyle,
): string {
  const tile = style === 'tile'
  switch (unit) {
    case 'percent':
      return tile ? formatPercent(value, locale, 1, false) : formatNumber(value, locale, 1)
    case 'usd':
    case 'internationalDollar': {
      const text =
        Math.abs(value) >= COMPACT_FROM
          ? formatCompact(value, locale, 1)
          : formatNumber(value, locale, 0)
      return tile ? dollars(text, locale) : text
    }
    case 'people': {
      const text = people(value, locale)
      return tile && Math.abs(value) >= MILLION ? `${text}${NBSP}M` : text
    }
    case 'squareKm':
      return tile ? `${formatNumber(value, locale, 0)}${NBSP}km²` : formatNumber(value, locale, 0)
    case 'tonnes':
      return tile ? `${formatNumber(value, locale, 1)}${NBSP}t` : formatNumber(value, locale, 1)
    default:
      return formatNumber(value, locale, 1)
  }
}

/** A tick of the chart's value axis: short, the unit in the title. */
export function formatMacroAxis(value: number, unit: MacroUnit, locale: Locale): string {
  if (unit === 'people') return formatCompact(value, locale, 1)
  if (unit === 'usd' || unit === 'internationalDollar' || unit === 'squareKm')
    return Math.abs(value) >= 1000
      ? formatCompact(value, locale, 1)
      : formatNumber(value, locale, 0)
  // Whole ticks are written whole, as the mockup's 15, 10, 5, 0, -5.
  return formatNumber(value, locale, Number.isInteger(value) || Math.abs(value) >= 100 ? 0 : 1)
}
