import { clsx } from 'clsx'
import { Pause, Play } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CURVE_COLOR_TOKENS, useMaturityLabel } from '@/entities/yield-curve'
import { useFormat } from '@/shared/i18n'
import { useInView } from '@/shared/lib/useInView'
import { useMediaQuery } from '@/shared/lib/useMediaQuery'
import { Flash } from '@/shared/ui/Flash'
import { changePctOf, type SampleQuote } from '../lib/liveQuotes'
import { useLiveQuotes } from '../model/useLiveQuotes'
import { useTypedCommand } from '../model/useTypedCommand'

// Sample figures of the screen 1 and screen 4 mockups: the picture calls no endpoint, the
// visitor has no session.
const INDICES: readonly SampleQuote[] = [
  { code: 'BVMAC-A', value: 1284.37, previousClose: 1278.98, tick: 0.01 },
  { code: 'CMK-BANK', value: 982.1, previousClose: 972.77, tick: 0.01 },
  { code: 'CMK-AGRI', value: 1104.55, previousClose: 1107.97, tick: 0.01 },
  { code: 'CMK-GA', value: 874.6, previousClose: 880.02, tick: 0.01 },
]

const MOVERS: readonly SampleQuote[] = [
  { code: 'BANGE', value: 26750, previousClose: 26200, tick: 50 },
  { code: 'SEMC', value: 52500, previousClose: 51900, tick: 50 },
  { code: 'SIAT', value: 18500, previousClose: 18700, tick: 50 },
  { code: 'SAFACAM', value: 38900, previousClose: 39100, tick: 50 },
]

const QUOTES = [...INDICES, ...MOVERS]

/** Commands of spec section 8, typed in turn in the command bar. */
const COMMANDS = ['SEMC DES', 'SAFACAM GP', 'YCRV', 'ECMR 6.25 2029 YAS', 'SIAT N']

/** BVMAC Equities over a month of sessions; the last close is the live value. */
// prettier-ignore
const INDEX_CLOSES = [
  1251.2, 1254.8, 1250.1, 1257.6, 1262.3, 1259.4, 1263.9, 1268.2, 1265, 1270.7,
  1268.4, 1273.9, 1271.2, 1276.5, 1274, 1279.8, 1277.1, 1281.6, 1278.98,
]

/** Cameroon's curve, 3 months to 10 years; the axis names four of the maturities. */
// prettier-ignore
const CURVE: readonly [years: number, ratePct: number][] = [
  [0.25, 4.6], [0.5, 4.9], [1, 5.3], [2, 5.8], [3, 6.2], [5, 6.6], [7, 6.9], [10, 7.2],
]
const CURVE_AXIS: readonly number[] = [0.25, 1, 5, 10]

interface LiveQuote {
  quote: SampleQuote
  value: number
}

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

const decimalsOf = (quote: SampleQuote) => (quote.tick < 1 ? 2 : 0)

/** The value flashes on each move, as in the screens (spec section 8). */
function Price({ quote, value }: LiveQuote) {
  const format = useFormat()
  return <Flash value={value}>{format.number(value, decimalsOf(quote))}</Flash>
}

function Change({ quote, value }: LiveQuote) {
  const format = useFormat()
  const changePct = changePctOf(quote, value)
  return (
    <span className={changePct >= 0 ? 'text-up' : 'text-down'}>{format.percent(changePct, 2)}</span>
  )
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

function Quotes({ rows }: { rows: readonly LiveQuote[] }) {
  return (
    <table className="w-full font-mono text-data">
      <tbody>
        {rows.map((row) => (
          <tr key={row.quote.code} className="h-5">
            <td className="text-left">{row.quote.code}</td>
            <td className="text-right">
              <Price {...row} />
            </td>
            <td className="w-16 text-right">
              <Change {...row} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** The tape holds its items twice and slides by one copy, so it loops without a jump. */
function TickerTape({ rows, running }: { rows: readonly LiveQuote[]; running: boolean }) {
  const items = rows.map((row) => (
    <span key={row.quote.code} className="flex gap-1.5">
      <span className="text-secondary">{row.quote.code}</span>
      <Price {...row} />
      <Change {...row} />
    </span>
  ))
  return (
    <div className="h-6 overflow-hidden border-b bg-panel font-mono text-caption whitespace-nowrap">
      <div
        // Inline, so the animation shorthand of the class cannot set it back to running.
        style={{ animationPlayState: running ? 'running' : 'paused' }}
        className="flex h-full w-max motion-safe:animate-ticker"
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-4 px-2">
            {items}
          </div>
        ))}
      </div>
    </div>
  )
}

/** The line draws itself, then the area and the last close appear; the last close pulses. */
function IndexChart({ closes, running }: { closes: readonly number[]; running: boolean }) {
  const points = plot(closes, 320, 116, 6)
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
      <path
        d={`${line}L${lastX.toFixed(1)},116L6,116Z`}
        fill="url(#home-preview-fill)"
        className="motion-safe:animate-fade-in motion-safe:[animation-delay:1200ms]"
      />
      <path
        d={line}
        pathLength={1}
        fill="none"
        stroke="var(--info)"
        strokeWidth="2"
        strokeLinejoin="round"
        className="[stroke-dasharray:1] motion-safe:animate-draw motion-safe:[animation-delay:400ms]"
      />
      <g className="motion-safe:animate-fade-in motion-safe:[animation-delay:1900ms]">
        {running && (
          <circle
            cx={lastX}
            cy={lastY}
            r="3.5"
            fill="var(--info)"
            className="origin-center animate-ping [transform-box:fill-box]"
          />
        )}
        <circle
          cx={lastX}
          cy={lastY}
          r="3.5"
          fill="var(--info)"
          stroke="var(--bg-panel)"
          strokeWidth="2"
        />
      </g>
    </svg>
  )
}

/** The curve draws itself, then its points appear one maturity after the other. */
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
      <path
        d={pathOf(points)}
        pathLength={1}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        className="[stroke-dasharray:1] motion-safe:animate-draw motion-safe:[animation-delay:700ms]"
      />
      {points.map(([x, y], index) => (
        <circle
          key={x}
          cx={x}
          cy={y}
          r="3"
          fill={color}
          stroke="var(--bg-panel)"
          strokeWidth="2"
          className="motion-safe:animate-fade-in"
          style={{ animationDelay: `${1100 + index * 90}ms` }}
        />
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

interface TerminalPreviewProps {
  /** The page's animations stopped by the visitor, the backdrop's included. */
  paused: boolean
  onPausedChange: (paused: boolean) => void
}

/**
 * The hero's picture of the terminal, drawn with the screens' own tokens: the command bar typing
 * commands, the ticker tape, then indices, a price chart, top movers and a yield curve, whose
 * sample quotes move and flash. It moves only while on screen, never for a user who asks for less
 * motion, and its button pauses the page's animations (WCAG 2.2.2). A phone keeps the first two
 * panels.
 *
 * The browser's translation leaves it alone (`translate="no"`): it holds codes and figures, and a
 * translation swaps text nodes for its own, so the ones React changes on each tick would no longer
 * be in the page. Each changing text also stands alone in its element, which React rewrites whole,
 * so an extension that does the same cannot break it either.
 */
export function TerminalPreview({ paused, onPausedChange }: TerminalPreviewProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const running = inView && !paused && !reducedMotion

  const values = useLiveQuotes(QUOTES, running)
  const command = useTypedCommand(COMMANDS, running)
  const live = QUOTES.map((quote, index) => ({ quote, value: values[index] }))
  const indices = live.slice(0, INDICES.length)
  const movers = live.slice(INDICES.length)

  return (
    <figure
      translate="no"
      className="flex min-w-0 flex-col border bg-app shadow-[0_32px_80px_-32px_rgb(0_0_0/0.8)]"
    >
      <div ref={ref} role="img" aria-label={t('home.preview.label')} className="flex flex-col">
        <div className="flex h-8 items-center gap-2 border-b px-2 font-mono text-data">
          <span className="text-accent-amber">&gt;</span>
          <span className="flex items-center">
            <span>{command}</span>
            <span
              className={clsx('ml-px h-3.5 w-[7px] bg-accent-amber', running && 'animate-blink')}
            />
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 font-sans text-title font-semibold tracking-title text-up uppercase">
            <span className="relative flex size-1.5">
              {running && (
                <span className="absolute inset-0 animate-ping rounded-full bg-up opacity-75" />
              )}
              <span className="relative size-1.5 rounded-full bg-up" />
            </span>
            {t('shell.marketOpen')}
          </span>
        </div>
        <TickerTape rows={[...indices.slice(0, 2), ...movers]} running={running} />
        <div className="grid gap-px bg-border sm:grid-cols-[1fr_1.35fr]">
          <MiniPanel title={t('panels.indices')} code="MKT">
            <Quotes rows={indices} />
          </MiniPanel>
          <MiniPanel title={t('home.preview.index')} code="GP">
            <IndexChart closes={[...INDEX_CLOSES, indices[0].value]} running={running} />
          </MiniPanel>
          <MiniPanel title={t('panels.topMovers')} code="MKT" className="max-sm:hidden">
            <Quotes rows={movers} />
          </MiniPanel>
          <MiniPanel title={t('home.preview.curve')} code="YCRV" className="max-sm:hidden">
            <CurveChart />
          </MiniPanel>
        </div>
      </div>
      <figcaption className="flex h-7 items-center justify-between gap-2 border-t px-2 font-sans text-caption text-secondary">
        {t('home.preview.caption')}
        {!reducedMotion && (
          <button
            type="button"
            onClick={() => onPausedChange(!paused)}
            className="inline-flex items-center gap-1 outline-none hover:text-primary focus-visible:ring-1 focus-visible:ring-accent-amber"
          >
            {paused ? (
              <Play aria-hidden className="size-3" />
            ) : (
              <Pause aria-hidden className="size-3" />
            )}
            <span>{t(paused ? 'home.preview.play' : 'home.preview.pause')}</span>
          </button>
        )}
      </figcaption>
    </figure>
  )
}
