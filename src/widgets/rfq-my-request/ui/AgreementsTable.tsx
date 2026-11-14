import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AGREEMENT_TONES, formatFace, formatQuote, shortNumber } from '@/entities/rfq'
import type { RfqAgreementDto, RfqRequestDto } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'
import { DataTable } from '@/shared/ui/DataTable'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'

const helper = createDataColumnHelper<RfqAgreementDto>()

/**
 * The agreements of a confirmed request, one per answer selected (spec, screen 22, flow 5): its
 * number, the counterparty and its SVT, the face, the price, the amount and its status, "Awaiting
 * SVT" until both SVTs decide (ROADMAP step 45).
 */
export function AgreementsTable({ request }: { request: RfqRequestDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const buys = request.side === 'buy'
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('number', {
          header: t('rfqTrading.myRequest.agreementColumns.number'),
          meta: { width: 'minmax(84px, 1fr)' },
          cell: ({ getValue }) => <span className="text-info">{shortNumber(getValue())}</span>,
        }),
        helper.accessor((agreement) => (buys ? agreement.seller : agreement.buyer).organization, {
          id: 'counterparty',
          header: t('rfqTrading.myRequest.agreementColumns.counterparty'),
          meta: { width: 'minmax(120px, 2fr)' },
          cell: ({ row }) => {
            const party = buys ? row.original.seller : row.original.buyer
            return <span className="text-primary">{`${party.name} · ${party.organization}`}</span>
          },
        }),
        helper.accessor((agreement) => (buys ? agreement.sellerSvt : agreement.buyerSvt).name, {
          id: 'svt',
          header: t('rfqTrading.myRequest.agreementColumns.svt'),
          meta: { width: 'minmax(64px, 1fr)' },
        }),
        helper.accessor('faceAmount', {
          header: t('rfqTrading.myRequest.agreementColumns.face'),
          meta: { align: 'right', width: 'minmax(64px, 1fr)' },
          cell: ({ getValue }) => (
            <span className="tabular-nums">{formatFace(getValue(), locale)}</span>
          ),
        }),
        helper.accessor('price', {
          header: t('rfqTrading.myRequest.agreementColumns.price'),
          meta: { align: 'right', width: 'minmax(64px, 1fr)' },
          cell: ({ getValue }) => (
            <span className="tabular-nums">{formatQuote(getValue(), locale)}</span>
          ),
        }),
        helper.accessor('settlementAmount', {
          header: t('rfqTrading.myRequest.agreementColumns.amount'),
          meta: { align: 'right', width: 'minmax(110px, 1.5fr)' },
          cell: ({ getValue }) => (
            <span className="tabular-nums">{format.number(getValue(), 0)}</span>
          ),
        }),
        helper.accessor('status', {
          header: t('rfqTrading.myRequest.agreementColumns.status'),
          meta: { width: 'minmax(104px, 1fr)' },
          cell: ({ getValue }) => (
            <Badge tone={AGREEMENT_TONES[getValue()]}>
              {t(`rfqTrading.agreementStatus.${getValue()}`)}
            </Badge>
          ),
        }),
      ]),
    [buys, format, locale, t],
  )

  return (
    <section aria-labelledby={`rfq-agreements-${request.id}`} className="flex flex-col gap-1">
      <h3
        id={`rfq-agreements-${request.id}`}
        className="font-sans text-label font-semibold tracking-title text-accent-amber uppercase"
      >
        {t('rfqTrading.myRequest.agreements')}
      </h3>
      <div className="flex max-h-48 min-h-0 flex-col">
        <DataTable
          data={request.agreements}
          columns={columns}
          getRowId={(agreement) => agreement.id}
          enableSorting={false}
          exportName={`${request.number}-agreements`}
        />
      </div>
    </section>
  )
}
