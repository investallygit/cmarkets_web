import { useMemo, type MutableRefObject } from 'react'
import { useTranslation } from 'react-i18next'
import {
  changeTone,
  coverPercent,
  coverTone,
  formatChangeBp,
  useAuctionLabel,
  useAuctions,
  type AuctionTone,
} from '@/entities/auction'
import type { AuctionDto } from '@/shared/api/contracts'
import { cemacCode3 } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable, type TableExporter } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { billions } from '../lib/amounts'
import { yearSpan, type AuctionFilters } from '../model/filters'

const helper = createDataColumnHelper<AuctionDto>()
const idOf = (auction: AuctionDto) => auction.id

const TONE: Record<AuctionTone, string | undefined> = {
  up: 'text-up',
  down: 'text-down',
  neutral: undefined,
}

interface AuctionResultsPanelProps {
  filters: AuctionFilters
  selectedId: string | null
  onSelect: (auction: AuctionDto) => void
  /** The filter bar's Download exports the table. */
  exportRef?: MutableRefObject<TableExporter | null>
}

/**
 * AUC's latest results (screen 33): the date, the state, the security, its maturity, the amounts
 * offered, bid and allotted (XAF bn), the cover (red below 100%), the average and marginal rates
 * and the change from the previous auction of the same security; a row, clicked or reached with
 * the arrows, picks the auction: its bids and its security's history. API /auctions?status=done.
 */
export function AuctionResultsPanel({
  filters,
  selectedId,
  onSelect,
  exportRef,
}: AuctionResultsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const label = useAuctionLabel()
  const auctions = useAuctions({
    ...yearSpan(filters.year),
    country: filters.country || undefined,
    instrument: filters.type || undefined,
  })
  const bp = t('auctionMarket.bp')

  const columns = useMemo(() => {
    const amount = (key: 'amountOffered' | 'amountBid' | 'amountAllotted', header: string) =>
      helper.accessor((auction) => billions(auction[key]), {
        id: key,
        header,
        meta: { align: 'right' },
        cell: ({ getValue }) => format.number(getValue(), 1),
      })
    return helper.columns([
      helper.accessor('date', {
        header: t('auctionMarket.results.columns.date'),
        cell: ({ getValue }) => (
          <span className="text-secondary">{format.isoDate(getValue())}</span>
        ),
      }),
      helper.accessor((auction) => cemacCode3(auction.country), {
        id: 'country',
        header: t('auctionMarket.results.columns.country'),
        cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
      }),
      helper.accessor((auction) => label(auction), {
        id: 'security',
        header: t('auctionMarket.results.columns.security'),
      }),
      helper.accessor('maturityDate', {
        header: t('auctionMarket.results.columns.maturity'),
        cell: ({ getValue }) => format.isoDate(getValue()),
      }),
      amount('amountOffered', t('auctionMarket.results.columns.offered')),
      amount('amountBid', t('auctionMarket.results.columns.bid')),
      amount('amountAllotted', t('auctionMarket.results.columns.allotted')),
      helper.accessor((auction) => coverPercent(auction.coverRatio), {
        id: 'cover',
        header: t('auctionMarket.results.columns.cover'),
        meta: { align: 'right' },
        cell: ({ row, getValue }) => (
          <span className={TONE[coverTone(row.original.coverRatio)]}>
            {format.number(getValue(), 0)}%
          </span>
        ),
      }),
      helper.accessor('averageRate', {
        header: t('auctionMarket.results.columns.average'),
        meta: { align: 'right' },
        cell: ({ getValue }) => format.percent(getValue(), 2, false),
      }),
      helper.accessor('marginalRate', {
        header: t('auctionMarket.results.columns.marginal'),
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className="text-secondary">{format.percent(getValue(), 2, false)}</span>
        ),
      }),
      helper.accessor('changeBp', {
        header: t('auctionMarket.results.columns.change'),
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className={TONE[changeTone(getValue())]}>{formatChangeBp(getValue(), bp)}</span>
        ),
      }),
    ])
  }, [t, format, label, bp])

  return (
    <Panel
      title={t('auctionMarket.results.title')}
      code="AUC"
      options={<span>{t('auctionMarket.results.amounts')}</span>}
      bodyClassName="flex flex-col"
    >
      <QueryView
        query={auctions}
        isEmpty={(rows) => rows.length === 0}
        emptyMessage={t('auctionMarket.results.empty')}
      >
        {(rows) => (
          <DataTable
            data={rows}
            columns={columns}
            getRowId={idOf}
            selectedRowId={selectedId}
            onRowClick={onSelect}
            exportName={`auc-results-${filters.year}`}
            exportRef={exportRef}
          />
        )}
      </QueryView>
      <p className="shrink-0 border-t px-2 py-1 font-sans text-title text-secondary">
        {t('auctionMarket.results.note')}
      </p>
    </Panel>
  )
}
