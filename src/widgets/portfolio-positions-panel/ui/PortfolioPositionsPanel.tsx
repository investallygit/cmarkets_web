import type { TFunction } from 'i18next'
import { Minus, Plus } from 'lucide-react'
import { useContext, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  openTransactionDialog,
  usePortfolio,
  usePositions,
  valueAtPrices,
} from '@/entities/portfolio'
import { LiveChangePct, LivePrice, priceDecimals, useLivePrices } from '@/entities/quote'
import { useHasPermission } from '@/entities/session'
import { useSecurityMenu } from '@/features/security-actions'
import type { PositionDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useSymbolSubscription } from '@/shared/realtime'
import { securityPath } from '@/shared/routes/paths'
import { Badge } from '@/shared/ui/Badge'
import { ChangeText } from '@/shared/ui/ChangeText'
import { createDataColumnHelper, type DataColumns } from '@/shared/ui/dataColumns'
import { DataTable, type TableExporter } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { TableExportContext } from '@/shared/ui/tableExport'

const helper = createDataColumnHelper<PositionDto>()
const getSecurityId = (position: PositionDto) => position.securityId

function buildColumns(
  t: TFunction,
  format: ReturnType<typeof useFormat>,
  currency: string,
  limit: number | null,
): DataColumns<PositionDto> {
  return [
    helper.accessor('code', {
      header: t('columns.security'),
      meta: { width: '1.4fr' },
      cell: ({ row, getValue }) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="truncate text-accent-amber" title={row.original.name}>
            {getValue()}
          </span>
          {row.original.isStale && (
            <span title={t('portfolio.positions.staleHint')}>
              <Badge tone="warning">{t('portfolio.positions.stale')}</Badge>
            </span>
          )}
        </span>
      ),
    }),
    helper.accessor('quantity', {
      header: t('columns.quantity'),
      meta: { align: 'right' },
      cell: ({ getValue }) => format.number(getValue(), 0),
    }),
    helper.accessor('averageCost', {
      header: t('portfolio.positions.averageCost'),
      meta: { align: 'right' },
      cell: ({ row, getValue }) =>
        format.number(getValue(), priceDecimals(row.original.type, row.original.currency)),
    }),
    helper.accessor('price', {
      header: t('columns.price'),
      meta: { align: 'right' },
      cell: ({ row }) => (
        <LivePrice
          symbol={row.original.securityId}
          value={row.original.price}
          decimals={priceDecimals(row.original.type, row.original.currency)}
          isDelayed={row.original.isDelayed}
        />
      ),
    }),
    helper.accessor((position) => (position.price / position.previousClose - 1) * 100, {
      id: 'dayChange',
      header: t('portfolio.positions.dayChange'),
      meta: { align: 'right' },
      cell: ({ row, getValue }) => (
        <LiveChangePct symbol={row.original.securityId} value={getValue()} />
      ),
    }),
    helper.accessor('value', {
      header: t('portfolio.positions.value', { currency }),
      meta: { align: 'right', width: '1.3fr' },
      cell: ({ getValue }) => format.number(getValue(), 0),
    }),
    helper.accessor('unrealizedPct', {
      header: t('portfolio.positions.unrealized'),
      meta: { align: 'right' },
      cell: ({ row, getValue }) => (
        <span
          title={t('portfolio.positions.unrealizedAmount', {
            amount: format.signed(row.original.unrealizedGain, 0),
            currency,
          })}
        >
          <ChangeText value={getValue()} percent />
        </span>
      ),
    }),
    helper.accessor('weightPct', {
      header: t('portfolio.positions.weight'),
      meta: { align: 'right', width: '0.9fr' },
      // Above the limit on one issuer: yellow with ▲ (spec section 9).
      cell: ({ getValue }) => {
        const weight = getValue()
        if (limit === null || weight <= limit) return format.percent(weight, 1, false)
        return (
          <span
            className="text-warning"
            title={t('portfolio.positions.aboveLimit', { limit: format.percent(limit, 1, false) })}
          >
            {format.percent(weight, 1, false)}&nbsp;▲
            <span className="sr-only">
              {t('portfolio.positions.aboveLimit', { limit: format.percent(limit, 1, false) })}
            </span>
          </span>
        )
      },
    }),
  ]
}

interface PortfolioPositionsPanelProps {
  portfolioId: string
  /** "IMPORT CSV" in the title bar, for a real portfolio the user may change. */
  onImport?: () => void
}

/**
 * Screen 5, valued positions: quantity, average cost, live price and day change, value,
 * unrealized gain and weight, cash last. API GET /portfolios/{id}/positions.
 */
export function PortfolioPositionsPanel({ portfolioId, onImport }: PortfolioPositionsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const navigate = useNavigate()
  const securityMenu = useSecurityMenu()
  const canExport = useContext(TableExportContext)
  const canWrite = useHasPermission('portfolios:write')
  const exportRef = useRef<TableExporter | null>(null)
  const portfolio = usePortfolio(portfolioId).data
  const positions = usePositions(portfolioId)
  const ids = positions.data?.items.map((item) => item.securityId) ?? []
  useSymbolSubscription(ids)
  const prices = useLivePrices(ids)
  const currency = positions.data?.currency ?? portfolio?.currency ?? ''
  const limit = portfolio?.limits.issuerWeightPct ?? null
  const real = portfolio?.kind === 'real'

  const columns = useMemo(
    () => buildColumns(t, format, currency, limit),
    [t, format, currency, limit],
  )

  const rowMenu = (position: PositionDto) => [
    ...securityMenu({ id: position.securityId, code: position.code }),
    ...(real && canWrite
      ? [
          { id: 'trade-separator', label: '', kind: 'separator' as const },
          {
            id: 'buy',
            label: t('portfolio.positions.buy', { code: position.code }),
            icon: Plus,
            onSelect: () =>
              openTransactionDialog({
                portfolioId,
                preset: {
                  type: 'buy',
                  security: { id: position.securityId, code: position.code, type: position.type },
                  price: position.price,
                },
              }),
          },
          {
            id: 'sell',
            label: t('portfolio.positions.sell', { code: position.code }),
            icon: Minus,
            onSelect: () =>
              openTransactionDialog({
                portfolioId,
                preset: {
                  type: 'sell',
                  security: { id: position.securityId, code: position.code, type: position.type },
                  price: position.price,
                  quantity: position.quantity,
                },
              }),
          },
        ]
      : []),
  ]

  return (
    <Panel
      title={t('panels.positions')}
      code="PORT"
      options={
        <span className="panel-no-drag flex items-center gap-1.5">
          {canExport && (
            <>
              <span>{t('portfolio.positions.export')}</span>
              <button
                type="button"
                onClick={() => exportRef.current?.('xlsx')}
                className="hover:text-primary"
              >
                XLSX
              </button>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={() => exportRef.current?.('csv')}
                className="hover:text-primary"
              >
                CSV
              </button>
            </>
          )}
          {onImport && real && canWrite && (
            <>
              {canExport && <span aria-hidden>·</span>}
              <button type="button" onClick={onImport} className="uppercase hover:text-primary">
                {t('portfolio.positions.import')}
              </button>
            </>
          )}
        </span>
      }
    >
      <QueryView query={positions}>
        {(data) => {
          const live = valueAtPrices(data, prices)
          return (
            <DataTable
              data={live.items}
              columns={columns}
              getRowId={getSecurityId}
              onRowDoubleClick={(position) => void navigate(securityPath(position.securityId))}
              rowMenu={rowMenu}
              exportName="port-positions"
              exportRef={exportRef}
              emptyMessage={t('portfolio.positions.empty')}
              footer={{
                cells: {
                  code: (
                    <span className="font-sans text-primary">
                      {t('portfolio.positions.cash', { currency })}
                    </span>
                  ),
                  value: format.number(live.cash, 0),
                  weightPct: format.percent(live.cashWeightPct, 1, false),
                },
                values: {
                  code: t('portfolio.positions.cash', { currency }),
                  value: Math.round(live.cash),
                  weightPct: Number(live.cashWeightPct.toFixed(2)),
                },
              }}
            />
          )
        }}
      </QueryView>
    </Panel>
  )
}
