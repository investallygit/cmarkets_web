import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuctionLabel, usePlannedAuctions } from '@/entities/auction'
import type { PlannedAuctionDto } from '@/shared/api/contracts'
import { cemacCode3 } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { billions } from '../lib/amounts'

const helper = createDataColumnHelper<PlannedAuctionDto>()
const idOf = (auction: PlannedAuctionDto) => auction.id

interface UpcomingAuctionsPanelProps {
  /** Today in Douala: the coming auctions from it on. */
  today: string
  /** AUC NEXT shows the value date and the maturity too. */
  full?: boolean
}

/**
 * The coming auctions (screen 33, AUC NEXT): the date, the state, the security and the amount
 * offered (XAF bn), soonest first, from the Treasuries' calendars (AUCTION_CALENDAR). API
 * /auctions?status=planned.
 */
export function UpcomingAuctionsPanel({ today, full = false }: UpcomingAuctionsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const label = useAuctionLabel()
  const planned = usePlannedAuctions({ from: today })

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('date', {
          header: t('auctionMarket.upcoming.columns.date'),
          cell: ({ getValue }) => format.isoDate(getValue()),
        }),
        helper.accessor((auction) => cemacCode3(auction.country), {
          id: 'country',
          header: t('auctionMarket.upcoming.columns.country'),
          cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
        }),
        helper.accessor((auction) => label(auction), {
          id: 'security',
          header: t('auctionMarket.upcoming.columns.security'),
        }),
        ...(full
          ? [
              helper.accessor((auction) => auction.valueDate ?? '', {
                id: 'valueDate',
                header: t('auctionMarket.upcoming.columns.valueDate'),
                cell: ({ getValue }) => (getValue() ? format.isoDate(getValue()) : '—'),
              }),
              helper.accessor('maturityDate', {
                header: t('auctionMarket.upcoming.columns.maturity'),
                cell: ({ getValue }) => format.isoDate(getValue()),
              }),
            ]
          : []),
        helper.accessor((auction) => billions(auction.amountOffered), {
          id: 'offered',
          header: t('auctionMarket.upcoming.columns.offered'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 1),
        }),
      ]),
    [t, format, label, full],
  )

  return (
    <Panel title={t('auctionMarket.upcoming.title')} code="AUC NEXT" bodyClassName="flex flex-col">
      <QueryView
        query={planned}
        isEmpty={(rows) => rows.length === 0}
        emptyMessage={t('auctionMarket.upcoming.empty')}
      >
        {(rows) => (
          <DataTable data={rows} columns={columns} getRowId={idOf} exportName="auc-next" />
        )}
      </QueryView>
      <p className="shrink-0 border-t px-2 py-1 font-sans text-title text-secondary">
        {t('auctionMarket.upcoming.source')}
      </p>
    </Panel>
  )
}
