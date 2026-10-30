import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuctionLabel, useAuctions } from '@/entities/auction'
import type { AuctionDto, AuctionInstrument } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { PanelSelect } from '@/shared/ui/PanelSelect'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<AuctionDto>()
const getAuctionId = (auction: AuctionDto) => auction.id
const INSTRUMENTS = ['', 'BTA', 'OTA'] as const

/**
 * Screen 4 mockup, latest government securities auctions (BEAC): amounts in millions of XAF,
 * cover ratio in green above 1 and red below. Shown by CAL, and by YCRV next. API /auctions.
 */
export function AuctionsPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const auctionLabel = useAuctionLabel()
  const [country, setCountry] = useState('')
  const [instrument, setInstrument] = useState<'' | AuctionInstrument>('')
  const auctions = useAuctions({
    country: country || undefined,
    instrument: instrument || undefined,
  })

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('date', {
          header: t('columns.date'),
          meta: { width: '96px' },
          cell: ({ getValue }) => (
            <span className="text-secondary">{format.isoDate(getValue())}</span>
          ),
        }),
        helper.accessor((auction) => format.country(auction.country), {
          id: 'country',
          header: t('columns.country'),
          cell: ({ getValue }) => <span className="font-sans text-accent-amber">{getValue()}</span>,
        }),
        helper.accessor((auction) => auctionLabel(auction), {
          id: 'security',
          header: t('columns.security'),
        }),
        helper.accessor('amountOffered', {
          header: t('columns.amountOffered'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
        helper.accessor('amountBid', {
          header: t('columns.bids'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
        helper.accessor('coverRatio', {
          header: t('columns.coverRatio'),
          meta: { align: 'right' },
          cell: ({ getValue }) => {
            const ratio = getValue()
            return (
              <span className={clsx(ratio > 1 && 'text-up', ratio < 1 && 'text-down')}>
                {format.number(ratio, 2)}x
              </span>
            )
          },
        }),
        helper.accessor('averageRate', {
          header: t('columns.averageRate'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.percent(getValue(), 2, false),
        }),
        helper.accessor('marginalRate', {
          header: t('columns.marginalRate'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.percent(getValue(), 2, false),
        }),
      ]),
    [t, format, auctionLabel],
  )

  return (
    <Panel
      title={t('panels.auctions')}
      code="CAL"
      options={
        <>
          <span>{t('auctions.filters')}</span>
          <PanelSelect
            value={country}
            options={[
              { value: '', label: t('auctions.allCountries') },
              ...CEMAC_COUNTRIES.map((code) => ({ value: code, label: format.country(code) })),
            ]}
            onChange={setCountry}
            aria-label={t('auctions.country')}
          />
          <span aria-hidden>·</span>
          <PanelSelect
            value={instrument}
            options={INSTRUMENTS.map((value) => ({
              value,
              label: t(`auctions.instruments.${value || 'all'}`),
            }))}
            onChange={setInstrument}
            aria-label={t('auctions.instrument')}
          />
        </>
      }
    >
      <QueryView query={auctions}>
        {(data) => (
          <DataTable
            data={data}
            columns={columns}
            getRowId={getAuctionId}
            exportName="beac-auctions"
          />
        )}
      </QueryView>
    </Panel>
  )
}
