import {
  ColorType,
  CrosshairMode,
  LineStyle,
  type ChartOptions,
  type DeepPartial,
  type LocalizationOptions,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts'
import {
  formatDate,
  formatIsoDate,
  formatNumber,
  formatTime,
  toMarketDay,
  type Locale,
} from '@/shared/lib/format'
import { cssVar } from '@/shared/lib/theme'

/** Douala is UTC+1 all year round; the chart displays timestamps as given, so shift them. */
const DOUALA_OFFSET_SECONDS = 3600

/** Market day for daily data, Douala wall-clock time for intraday data. */
export function toChartTime(iso: string, intraday: boolean): Time {
  if (!intraday) return toMarketDay(iso)
  return (Math.floor(Date.parse(iso) / 1000) + DOUALA_OFFSET_SECONDS) as UTCTimestamp
}

/** A chart time back as text: "28/10/2026", or "28/10/2026 10:42" for intraday data. */
export function formatChartTime(time: Time): string {
  if (typeof time === 'string') return formatIsoDate(time)
  if (typeof time === 'number') {
    // Already shifted to Douala wall-clock time by toChartTime.
    const date = new Date(time * 1000)
    return `${formatDate(date, 'UTC')} ${formatTime(date, 'UTC')}`
  }
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(time.day)}/${pad(time.month)}/${time.year}`
}

/** Terminal look shared by the charts (spec section 8): panel background, mono labels. */
export function baseChartOptions(): DeepPartial<ChartOptions> {
  return {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: cssVar('--bg-panel') },
      textColor: cssVar('--text-secondary'),
      fontFamily: "'JetBrains Mono Variable', monospace",
      fontSize: 11,
      // Required by the Lightweight Charts licence unless TradingView is credited elsewhere.
      attributionLogo: true,
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { color: cssVar('--border'), style: LineStyle.Dotted },
    },
    rightPriceScale: { borderColor: cssVar('--border') },
    timeScale: { borderColor: cssVar('--border') },
    crosshair: { mode: CrosshairMode.Normal },
  }
}

/** Prices in the user's number format, dates as DD/MM/YYYY. */
export function chartLocalization(
  locale: Locale,
  decimals: number,
): DeepPartial<LocalizationOptions<Time>> {
  return {
    locale: locale === 'fr' ? 'fr-FR' : 'en-US',
    dateFormat: 'dd/MM/yyyy',
    priceFormatter: (price: number) => formatNumber(price, locale, decimals),
  }
}
