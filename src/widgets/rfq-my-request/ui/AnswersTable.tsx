import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { countryCode3, formatFace, formatQuote } from '@/entities/rfq'
import type { RfqRequestDto, RfqResponseDto } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { DataTable } from '@/shared/ui/DataTable'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'

const helper = createDataColumnHelper<RfqResponseDto>()

/**
 * The answers of a request as its organisation reads them, in the selection's order (spec, screen
 * 22: "rank, trader and organisation, chosen SVT, price, yield, quantity, time"), each with the
 * face allocated; an answer withdrawn or expired, out of the ranking, says so. By criteria (sixth
 * version), as the mockup: the security each offers, its country, maturity, price and yield.
 */
export function AnswersTable({
  request,
  rateLabel,
  byCriteria = false,
}: {
  request: RfqRequestDto
  rateLabel: 'rate' | 'yield'
  byCriteria?: boolean
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const columns = useMemo(() => {
    const rank = helper.accessor((response) => response.rank ?? Number.POSITIVE_INFINITY, {
      id: 'rank',
      header: t('rfqTrading.myRequest.columns.rank'),
      meta: { width: '48px' },
      cell: ({ row }) => row.original.rank ?? '–',
    })
    const trader = helper.accessor(
      (response) => `${response.responder.name} · ${response.responder.organization}`,
      {
        id: 'trader',
        header: byCriteria
          ? t('rfqCriteria.myRequest.columns.responder')
          : t('rfqTrading.myRequest.columns.trader'),
        meta: { width: 'minmax(150px, 2fr)' },
        cell: ({ getValue }) => <span className="text-primary">{getValue()}</span>,
      },
    )
    const price = helper.accessor('price', {
      header: byCriteria
        ? t('rfqCriteria.myRequest.columns.price')
        : t('rfqTrading.myRequest.columns.price'),
      meta: { align: 'right', width: 'minmax(72px, 1fr)' },
      cell: ({ getValue }) => (
        <span className="tabular-nums text-primary">{formatQuote(getValue(), locale)}</span>
      ),
    })
    const quantity = helper.accessor('quantity', {
      header: t('rfqTrading.myRequest.columns.quantity'),
      meta: { align: 'right', width: 'minmax(72px, 1fr)' },
      cell: ({ getValue }) => (
        <span className="tabular-nums">{formatFace(getValue(), locale)}</span>
      ),
    })
    const allocation = helper.accessor('allocated', {
      header: t('rfqTrading.myRequest.columns.allocation'),
      meta: { align: 'right', width: 'minmax(96px, 1fr)' },
      cell: ({ row }) => {
        const { allocated, status } = row.original
        if (allocated > 0)
          return <span className="tabular-nums text-up">{formatFace(allocated, locale)}</span>
        return status === 'withdrawn' || status === 'expired' ? (
          <span className="text-secondary">{t(`rfqTrading.responseStatus.${status}`)}</span>
        ) : (
          '–'
        )
      },
    })
    if (byCriteria)
      return helper.columns([
        rank,
        trader,
        helper.accessor((response) => response.security?.code ?? '', {
          id: 'security',
          header: t('rfqCriteria.myRequest.columns.security'),
          meta: { width: 'minmax(130px, 2fr)' },
          cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
        }),
        helper.accessor((response) => countryCode3(response.security?.country ?? ''), {
          id: 'country',
          header: t('rfqCriteria.myRequest.columns.country'),
          meta: { width: '64px' },
        }),
        helper.accessor((response) => response.remainingYears ?? 0, {
          id: 'maturity',
          header: t('rfqCriteria.myRequest.columns.maturity'),
          meta: { align: 'right', width: '72px' },
          cell: ({ getValue }) => (
            <span className="tabular-nums">{format.number(getValue(), 2)}</span>
          ),
        }),
        price,
        helper.accessor((response) => response.yieldPct ?? 0, {
          id: 'yield',
          header: t('rfqCriteria.myRequest.columns.yield'),
          meta: { align: 'right', width: 'minmax(64px, 1fr)' },
          cell: ({ getValue }) => (
            <span className="tabular-nums">{`${format.number(getValue(), 2)}%`}</span>
          ),
        }),
        quantity,
        allocation,
      ])
    return helper.columns([
      rank,
      trader,
      helper.accessor((response) => response.svt.name, {
        id: 'svt',
        header: t('rfqTrading.myRequest.columns.svt'),
        meta: { width: 'minmax(72px, 1fr)' },
      }),
      price,
      helper.accessor('ratePct', {
        header: t(`rfqTrading.myRequest.columns.${rateLabel}`),
        meta: { align: 'right', width: 'minmax(64px, 1fr)' },
        cell: ({ getValue }) => (
          <span className="tabular-nums">{`${format.number(getValue(), 2)}%`}</span>
        ),
      }),
      quantity,
      helper.accessor('updatedAt', {
        header: t('rfqTrading.myRequest.columns.time'),
        meta: { align: 'right', width: 'minmax(72px, 1fr)' },
        cell: ({ getValue }) => (
          <span className="tabular-nums">{format.time(getValue(), true)}</span>
        ),
      }),
      allocation,
    ])
  }, [byCriteria, format, locale, rateLabel, t])

  return (
    <div className="flex max-h-60 min-h-0 flex-col">
      <DataTable
        data={request.responses ?? []}
        columns={columns}
        getRowId={(response) => response.id}
        enableSorting={false}
        emptyMessage={t('rfqTrading.myRequest.noAnswer')}
        exportName={request.number}
      />
    </div>
  )
}
