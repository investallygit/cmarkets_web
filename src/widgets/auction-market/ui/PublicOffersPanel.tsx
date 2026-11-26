import { clsx } from 'clsx'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { usePublicOffers } from '@/entities/auction'
import type { PublicOfferDto, PublicOfferStatus } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { billions } from '../lib/amounts'

const helper = createDataColumnHelper<PublicOfferDto>()
const idOf = (offer: PublicOfferDto) => offer.id

const STATUS_TONE: Record<PublicOfferStatus, string> = {
  upcoming: 'text-info',
  open: 'text-up',
  closed: 'text-secondary',
  withdrawn: 'text-down',
}

/**
 * APE, the public bond issues (screen 33, sixth version): the issuer and its kind, the state, the
 * amount sought, the coupon, the maturity, the subscription period, the arranger, the status and
 * the amount raised; entered by the Data admin in CORR (decision 58). API /public-offers.
 */
export function PublicOffersPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const offers = usePublicOffers()

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('issuer', {
          header: t('auctionMarket.offers.columns.issuer'),
          cell: ({ row, getValue }) => (
            <span className="font-sans">
              {getValue()}{' '}
              <span className="text-secondary">
                · {t(`auctionMarket.offers.kinds.${row.original.issuerKind}`)}
              </span>
            </span>
          ),
        }),
        helper.accessor((offer) => format.country(offer.country), {
          id: 'country',
          header: t('auctionMarket.offers.columns.country'),
        }),
        helper.accessor((offer) => billions(offer.amountSought), {
          id: 'sought',
          header: t('auctionMarket.offers.columns.sought'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 1),
        }),
        helper.accessor('couponPct', {
          header: t('auctionMarket.offers.columns.coupon'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.percent(getValue(), 2, false),
        }),
        helper.accessor('maturityDate', {
          header: t('auctionMarket.offers.columns.maturity'),
          cell: ({ getValue }) => format.isoDate(getValue()),
        }),
        helper.accessor('subscriptionStart', {
          header: t('auctionMarket.offers.columns.subscription'),
          cell: ({ row }) =>
            t('auctionMarket.offers.period', {
              from: format.isoDate(row.original.subscriptionStart),
              to: format.isoDate(row.original.subscriptionEnd),
            }),
        }),
        helper.accessor('arranger', {
          header: t('auctionMarket.offers.columns.arranger'),
          cell: ({ getValue }) => <span className="font-sans">{getValue()}</span>,
        }),
        helper.accessor((offer) => t(`auctionMarket.offers.statuses.${offer.status}`), {
          id: 'status',
          header: t('auctionMarket.offers.columns.status'),
          cell: ({ row, getValue }) => (
            <span className={clsx('font-sans', STATUS_TONE[row.original.status])}>
              {getValue()}
            </span>
          ),
        }),
        helper.accessor(
          (offer) => (offer.amountRaised === null ? null : billions(offer.amountRaised)),
          {
            id: 'raised',
            header: t('auctionMarket.offers.columns.raised'),
            meta: { align: 'right' },
            cell: ({ getValue }) => {
              const raised = getValue()
              return raised === null ? '—' : format.number(raised, 1)
            },
          },
        ),
      ]),
    [t, format],
  )

  return (
    <Panel title={t('auctionMarket.offers.title')} code="APE" bodyClassName="flex flex-col">
      <QueryView
        query={offers}
        isEmpty={(rows) => rows.length === 0}
        emptyMessage={t('auctionMarket.offers.empty')}
      >
        {(rows) => <DataTable data={rows} columns={columns} getRowId={idOf} exportName="ape" />}
      </QueryView>
      <p className="shrink-0 border-t px-2 py-1 font-sans text-title text-secondary">
        {t('auctionMarket.offers.source')}
      </p>
    </Panel>
  )
}
