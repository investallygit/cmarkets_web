import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CURVE_COLOR_TOKENS, useMaturityLabel } from '@/entities/yield-curve'
import { useFormat } from '@/shared/i18n'

// Sample values of the screen 1 and screen 4 mockups: the illustration calls no endpoint, the
// visitor has no session.
const INDICES = [
  { code: 'BVMAC-A', value: 1284.37, changePct: 0.42 },
  { code: 'CMK-BANK', value: 982.1, changePct: 0.96 },
  { code: 'CMK-AGRI', value: 1104.55, changePct: -0.31 },
  { code: 'CMK-GA', value: 874.6, changePct: -0.62 },
]

const MOVERS = [
  { code: 'BANGE', value: 26750, changePct: 2.1 },
  { code: 'SEMC', value: 52500, changePct: 1.16 },
  { code: 'SIAT', value: 18500, changePct: -1.07 },
  { code: 'SAFACAM', value: 38900, changePct: -0.51 },
]

/** BVMAC Equities over a month of sessions. */
// prettier-ignore
const INDEX_CLOSES = [
  1251.2, 1254.8, 1250.1, 1257.6, 1262.3, 1259.4, 1263.9, 1268.2, 1265, 1270.7,
  1268.4, 1273.9, 1271.2, 1276.5, 1274, 1279.8, 1277.1, 1281.6, 1278.98, 1284.37,
]

/** Cameroon's curve, 3 months to 10 years; the axis names four of the maturities. */
// prettier-ignore
const CURVE: readonly [years: number, ratePct: number][] = [
  [0.25, 4.6], [0.5, 4.9], [1, 5.3], [2, 5.8], [3, 6.2], [5, 6.6], [7, 6.9], [10, 7.2],
]
const CURVE_AXIS: readonly number[] = [0.25, 1, 5, 10]

/** Points of a series in a box, the highest value at the top, `inset` from each edge. */
function plot(values: readonly number[], width: number, height: number, inset: number) {
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  return values.map((value, index): [number, number] => [
    inset + (index / (values.length - 1)) * (width - 2 * inset),
    inset + (1 - (value - min) / span) * (height - 2 * inset),
  ])
}

const pathOf = (points: readonly [number, number][]) =>
  points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join('')

function Change({ value }: { value: number }) {
  const format = useFormat()
  return <span className={value >= 0 ? 'text-up' : 'text-down'}>{format.percent(value, 2)}</span>
}

function MiniPanel({
  title,
  code,
  className,
  children,
}: {
  title: string
  code: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={clsx('flex min-w-0 flex-col bg-panel', className)}>
      <div className="flex h-row shrink-0 items-center gap-2 border-b bg-panel-header px-2">
        <span className="truncate font-sans text-title font-semibold tracking-title text-accent-amber uppercase">
          {title}
        </span>
        <span className="ml-auto font-mono text-title text-secondary">{code}</span>
      </div>
      <div className="min-h-0 flex-1 p-2">{children}</div>
    </div>
  )
}

function Quotes({ rows, decimals }: { rows: typeof INDICES; decimals: number }) {
  const format = useFormat()
  return (
    <table className="w-full font-mono text-data">
      <tbody>
        {rows.map((row) => (
          <tr key={row.code} className="h-5">
            <td className="text-left">{row.code}</td>
            <td className="text-right">{format.number(row.value, decimals)}</td>
            <td className="w-16 text-right">
              <Change value={row.changePct} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function IndexChart() {
  const points = plot(INDEX_CLOSES, 320, 116, 6)
  const line = pathOf(points)
  const [lastX, lastY] = points[points.length - 1]
  return (
    <svg viewBox="0 0 320 116" className="h-auto w-full">
      <defs>
        <linearGradient id="home-preview-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--info)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--info)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((share) => (
        <line
          key={share}
          x1="0"
          x2="320"
          y1={116 * share}
          y2={116 * share}
          stroke="var(--border)"
          strokeDasharray="2 3"
        />
      ))}
      <path d={`${line}L${lastX.toFixed(1)},116L6,116Z`} fill="url(#home-preview-fill)" />
      <path d={line} fill="none" stroke="var(--info)" strokeWidth="2" strokeLinejoin="round" />
      <circle
        cx={lastX}
        cy={lastY}
        r="3.5"
        fill="var(--info)"
        stroke="var(--bg-panel)"
        strokeWidth="2"
      />
    </svg>
  )
}

function CurveChart() {
  const maturityLabel = useMaturityLabel()
  const color = `var(${CURVE_COLOR_TOKENS.CM})`
  const points = plot(
    CURVE.map(([, ratePct]) => ratePct),
    220,
    72,
    8,
  )
  return (
    <svg viewBox="0 0 220 88" className="h-auto w-full">
      <line x1="0" x2="220" y1="72" y2="72" stroke="var(--border)" />
      <path d={pathOf(points)} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {points.map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="3" fill={color} stroke="var(--bg-panel)" strokeWidth="2" />
      ))}
      {CURVE.map(
        ([years], index) =>
          CURVE_AXIS.includes(years) && (
            <text
              key={years}
              x={points[index][0]}
              y="86"
              textAnchor="middle"
              fill="var(--text-secondary)"
              fontSize="8"
              className="font-mono"
            >
              {maturityLabel(years)}
            </text>
          ),
      )}
    </svg>
  )
}

/**
 * The hero's picture of the terminal, drawn with the screens' own tokens: the command bar, the
 * ticker tape, then indices, a price chart, top movers and a yield curve. A phone keeps the first
 * two panels.
 */
export function TerminalPreview() {
  const { t } = useTranslation()
  const format = useFormat()
  return (
    <figure
      role="img"
      aria-label={t('home.preview.label')}
      className="flex min-w-0 flex-col border bg-app shadow-[0_32px_80px_-32px_rgb(0_0_0/0.8)]"
    >
      <div className="flex h-8 items-center gap-2 border-b px-2 font-mono text-data">
        <span className="text-accent-amber">&gt;</span>
        <span>SEMC DES</span>
        <span className="h-3.5 w-[7px] animate-pulse bg-accent-amber motion-reduce:animate-none" />
        <span className="ml-auto inline-flex items-center gap-1.5 font-sans text-title font-semibold tracking-title text-up uppercase">
          <span className="size-1.5 rounded-full bg-up" />
          {t('shell.marketOpen')}
        </span>
      </div>
      <div className="flex h-6 items-center gap-4 overflow-hidden border-b bg-panel px-2 font-mono text-caption whitespace-nowrap">
        {[...INDICES.slice(0, 2), ...MOVERS].map((item) => (
          <span key={item.code} className="flex gap-1.5">
            <span className="text-secondary">{item.code}</span>
            {format.number(item.value, item.value > 10_000 ? 0 : 2)}
            <Change value={item.changePct} />
          </span>
        ))}
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-[1fr_1.35fr]">
        <MiniPanel title={t('panels.indices')} code="MKT">
          <Quotes rows={INDICES} decimals={2} />
        </MiniPanel>
        <MiniPanel title={t('home.preview.index')} code="GP">
          <IndexChart />
        </MiniPanel>
        <MiniPanel title={t('panels.topMovers')} code="MKT" className="max-sm:hidden">
          <Quotes rows={MOVERS} decimals={0} />
        </MiniPanel>
        <MiniPanel title={t('home.preview.curve')} code="YCRV" className="max-sm:hidden">
          <CurveChart />
        </MiniPanel>
      </div>
      <figcaption className="flex h-6 items-center border-t px-2 font-sans text-caption text-secondary">
        {t('home.preview.caption')}
      </figcaption>
    </figure>
  )
}
