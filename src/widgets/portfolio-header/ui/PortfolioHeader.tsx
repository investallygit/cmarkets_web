import { clsx } from 'clsx'
import { ChevronDown, Plus, Settings, Trash2 } from 'lucide-react'
import { useCallback, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  openPortfolioDialog,
  rangeFrom,
  useIncome,
  usePerformance,
  usePortfolio,
  usePositions,
  valueAtPrices,
  withLiveDay,
} from '@/entities/portfolio'
import { useLiveIndex, useLivePrices } from '@/entities/quote'
import {
  DeletePortfolioDialog,
  usePortfolioAccess,
  usePortfolioQuota,
} from '@/features/manage-portfolios'
import type { PortfolioSummaryDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { useSymbolSubscription } from '@/shared/realtime'
import { Badge } from '@/shared/ui/Badge'
import { ChangeText } from '@/shared/ui/ChangeText'
import { ContextMenu } from '@/shared/ui/ContextMenu'
import type { MenuItem } from '@/shared/ui/menu'
import { TREND_TEXT, trendOf } from '@/shared/ui/trend'

interface PortfolioHeaderProps {
  portfolios: readonly PortfolioSummaryDto[]
  portfolioId: string
  onSelect: (portfolioId: string) => void
}

interface Figure {
  label: string
  value: ReactNode
}

const MISSING = '—'

/**
 * Screen 5 header: the portfolio selector, then 7 metrics (spec section 9). Value, day change and
 * the year-to-date returns follow the live prices between two valuations of the server.
 */
export function PortfolioHeader({ portfolios, portfolioId, onSelect }: PortfolioHeaderProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const today = useMarketDay()
  const current = portfolios.find((portfolio) => portfolio.id === portfolioId)
  const positions = usePositions(portfolioId).data
  const ids = positions?.items.map((item) => item.securityId) ?? []
  // Every tab shows the value: the lines' quotes are followed wherever the user is.
  useSymbolSubscription(ids)
  const prices = useLivePrices(ids)
  const live = positions && valueAtPrices(positions, prices)
  const performance = usePerformance(portfolioId, { from: rangeFrom('ytd', today) }).data
  const income = useIncome(portfolioId).data
  const liveIndex = useLiveIndex(performance?.benchmark.code ?? '')
  // The benchmark's IndexUpdated reaches only the screens that follow it.
  useSymbolSubscription(performance ? [performance.benchmark.code] : [])

  const period = (name: 'day' | 'ytd') =>
    performance?.periods.find((candidate) => candidate.period === name)
  const ytd = period('ytd')
  // Today's return, in the year's, moves with the live prices and index; not for a portfolio
  // whose first valuation is today's.
  const day = performance && period('day')?.from !== performance.to ? period('day') : undefined
  const portfolioYtd =
    ytd && day && live ? withLiveDay(ytd.twrPct, day.twrPct, live.dayChangePct) : ytd?.twrPct
  const benchmarkYtd =
    ytd?.benchmarkPct == null
      ? null
      : day?.benchmarkPct == null
        ? ytd.benchmarkPct
        : withLiveDay(ytd.benchmarkPct, day.benchmarkPct, liveIndex?.changePct ?? day.benchmarkPct)
  const currency = current?.currency ?? ''

  const figures: Figure[] = [
    {
      label: t('portfolio.header.totalValue'),
      value: live ? `${format.number(live.totalValue, 0)} ${currency}` : MISSING,
    },
    {
      label: t('portfolio.header.dayChange'),
      value: live ? (
        <span className={clsx('inline-flex gap-1.5', TREND_TEXT[trendOf(live.dayChange)])}>
          <ChangeText value={live.dayChangePct} percent />
          <span>
            ({live.dayChange >= 0 ? '+' : '-'}
            {format.compact(Math.abs(live.dayChange))})
          </span>
        </span>
      ) : (
        MISSING
      ),
    },
    {
      label: t('portfolio.header.ytd'),
      value: portfolioYtd === undefined ? MISSING : <ChangeText value={portfolioYtd} percent />,
    },
    {
      label: t('portfolio.header.benchmarkYtd'),
      value: benchmarkYtd === null ? MISSING : <ChangeText value={benchmarkYtd} percent />,
    },
    {
      label: t('portfolio.header.outperformance'),
      value:
        portfolioYtd === undefined || benchmarkYtd === null ? (
          MISSING
        ) : (
          <ChangeText value={portfolioYtd - benchmarkYtd} suffix={t('portfolio.points')} />
        ),
    },
    {
      label: t('portfolio.header.cash'),
      value: live ? format.percent(live.cashWeightPct, 1, false) : MISSING,
    },
    {
      label: t('portfolio.header.upcomingIncome'),
      value: income ? `${format.compact(income.upcoming3Months)} ${currency}` : MISSING,
    },
  ]

  return (
    <section
      aria-label={current?.name}
      className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-10 gap-y-2 border bg-panel px-3 py-1.5"
    >
      <PortfolioSelector portfolios={portfolios} current={current} onSelect={onSelect} />
      <dl className="flex flex-1 flex-wrap justify-between gap-x-8 gap-y-2">
        {figures.map((figure) => (
          <div key={figure.label} className="flex flex-col gap-0.5">
            <dt className="font-sans text-title whitespace-nowrap text-secondary">
              {figure.label}
            </dt>
            <dd className="font-mono text-label font-semibold whitespace-nowrap">{figure.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/**
 * The amber box of the mockup: the user's portfolios, those colleagues share with the
 * organisation, then new, settings and delete; a shared one says who holds it.
 */
function PortfolioSelector({
  portfolios,
  current,
  onSelect,
}: {
  portfolios: readonly PortfolioSummaryDto[]
  current: PortfolioSummaryDto | undefined
  onSelect: (portfolioId: string) => void
}) {
  const { t } = useTranslation()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [deleting, setDeleting] = useState<PortfolioSummaryDto | null>(null)
  const close = useCallback(() => setMenu(null), [])
  const quota = usePortfolioQuota()
  const { canWrite } = usePortfolioAccess(current?.id)
  const details = usePortfolio(current?.id).data
  const own = portfolios.filter((portfolio) => portfolio.sharedBy === null)
  const shared = portfolios.filter((portfolio) => portfolio.sharedBy !== null)

  const item = (portfolio: PortfolioSummaryDto): MenuItem => ({
    id: portfolio.id,
    label: [
      portfolio.name,
      portfolio.kind === 'model' && t('portfolio.kinds.model'),
      portfolio.sharedBy?.displayName,
    ]
      .filter(Boolean)
      .join(' · '),
    checked: portfolio.id === current?.id,
    onSelect: () => onSelect(portfolio.id),
  })
  const items: MenuItem[] = [
    ...own.map(item),
    ...(shared.length > 0
      ? [
          ...(own.length > 0
            ? [{ id: 'shared-separator', label: '', kind: 'separator' as const }]
            : []),
          { id: 'shared', label: t('portfolio.selector.shared'), kind: 'label' as const },
          ...shared.map(item),
        ]
      : []),
    ...(quota.canWrite
      ? [
          { id: 'separator', label: '', kind: 'separator' as const },
          {
            id: 'new',
            label: quota.reached
              ? t('portfolio.selector.quotaReached', { quota: quota.quota })
              : t('portfolio.selector.new'),
            icon: Plus,
            disabled: quota.reached,
            onSelect: () => openPortfolioDialog({ mode: 'create' }),
          },
        ]
      : []),
    // Only the owner changes or deletes a portfolio.
    ...(canWrite
      ? [
          {
            id: 'settings',
            label: t('portfolio.selector.settings'),
            icon: Settings,
            disabled: !details,
            onSelect: () => details && openPortfolioDialog({ mode: 'edit', portfolio: details }),
          },
          {
            id: 'delete',
            label: t('portfolio.selector.delete'),
            icon: Trash2,
            disabled: !current,
            onSelect: () => setDeleting(current ?? null),
          },
        ]
      : []),
  ]

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={menu !== null}
        onClick={(event) => {
          if (menu) return close()
          const rect = event.currentTarget.getBoundingClientRect()
          setMenu({ x: rect.left, y: rect.bottom + 4 })
        }}
        className="flex min-w-60 flex-col items-start border border-accent-amber px-3 py-1 text-left hover:bg-panel-header"
      >
        <span className="font-sans text-caption tracking-title text-secondary uppercase">
          {current?.sharedBy
            ? t('portfolio.selector.sharedBy', { name: current.sharedBy.displayName })
            : t('portfolio.selector.label')}
        </span>
        <span className="flex w-full items-center gap-2 font-mono text-label font-semibold text-accent-amber">
          <span className="truncate">{current?.name ?? MISSING}</span>
          {current?.kind === 'model' && <Badge tone="info">{t('portfolio.kinds.model')}</Badge>}
          {current?.sharedBy ? (
            <Badge>{t('portfolio.selector.readOnly')}</Badge>
          ) : (
            current?.sharedWithOrganization && <Badge>{t('portfolio.selector.sharedBadge')}</Badge>
          )}
          <ChevronDown aria-hidden className="ml-auto size-3.5 shrink-0" />
        </span>
      </button>
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={items} onClose={close} ignoreRef={buttonRef} />
      )}
      <DeletePortfolioDialog
        portfolio={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          const next = portfolios.find((portfolio) => portfolio.id !== deleting?.id)
          if (next) onSelect(next.id)
        }}
      />
    </>
  )
}
