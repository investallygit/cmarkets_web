import type { SortingState } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AGREEMENT_TONES, formatFace, formatQuote, shortNumber } from '@/entities/rfq'
import {
  EMAIL_TONES,
  useExportRfqAgreements,
  useRfqAgreements,
  type AgreementSort,
} from '@/entities/rfq-agreement'
import type { RfqAgreementRowDto, RfqAgreementSortKey } from '@/shared/api/contracts'
import type { RfqAgreementQuery } from '@/shared/api/endpoints'
import { useFormat, useLocale } from '@/shared/i18n'
import { saveBlob } from '@/shared/lib/download'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Pager } from '@/shared/ui/Pager'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'

/** A status's colour as text, the mockup's list: "Concluded" green, "SVT rejected" red. */
const TONE_TEXT = {
  neutral: 'text-secondary',
  info: 'text-info',
  amber: 'text-accent-amber',
  warning: 'text-warning',
  up: 'text-up',
  down: 'text-down',
} as const

const helper = createDataColumnHelper<RfqAgreementRowDto>()
const getId = (row: RfqAgreementRowDto) => row.id

interface AgreementListPanelProps {
  /** The filters applied, the order and the page. */
  query: RfqAgreementQuery
  sort: AgreementSort
  onSortChange: (sort: AgreementSort) => void
  onPageChange: (page: number) => void
  selectedId: string | null
  onSelect: (id: string) => void
  /** The Admin's list: both parties, where a party's and an SVT's read their side. */
  bothParties: boolean
  /** Filters are applied: an empty list says none matches, not that none exists. */
  filtered: boolean
}

/**
 * Screen 23's list (spec: "Number of results and total face amount; columns agreement number, date
 * and time, side, security, counterparty, counterparty's SVT, face amount, price, amount, agreed
 * settlement date, e-mail status; sorting, pagination, XLSX and CSV export"), sorted and paged by
 * the API; the side and the counterparty are the reader's (ROADMAP decision 26), the Admin's
 * columns both parties. A click shows the agreement.
 */
export function AgreementListPanel({
  query,
  sort,
  onSortChange,
  onPageChange,
  selectedId,
  onSelect,
  bothParties,
  filtered,
}: AgreementListPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const list = useRfqAgreements(query)
  const exportList = useExportRfqAgreements()
  const sorting: SortingState = [{ id: sort.id, desc: sort.desc }]

  const columns = useMemo(() => {
    const status = (row: RfqAgreementRowDto) => t(`rfqTrading.agreementStatus.${row.status}`)
    const party = (id: RfqAgreementSortKey, pick: (row: RfqAgreementRowDto) => string) =>
      helper.accessor(pick, {
        id,
        header: t(`rfqAgreements.list.columns.${id}` as 'rfqAgreements.list.columns.buyer'),
        meta: { width: 'minmax(96px, 1.4fr)' },
      })
    return helper.columns([
      helper.accessor('number', {
        header: t('rfqAgreements.list.columns.number'),
        meta: { width: '80px' },
        cell: ({ getValue }) => (
          <span className="text-info" title={getValue()}>
            {shortNumber(getValue())}
          </span>
        ),
      }),
      helper.accessor('createdAt', {
        header: t('rfqAgreements.list.columns.createdAt'),
        meta: { width: '84px' },
        cell: ({ getValue }) => (
          <span className="text-secondary tabular-nums">
            {`${format.dayMonth(getValue())} ${format.time(getValue())}`}
          </span>
        ),
      }),
      ...(bothParties
        ? []
        : [
            helper.accessor('side', {
              header: t('rfqAgreements.list.columns.side'),
              meta: { width: '48px' },
              cell: ({ getValue }) => (
                <span className={getValue() === 'buy' ? 'text-up' : 'text-down'}>
                  {t(`rfqTrading.sideUpper.${getValue()}`)}
                </span>
              ),
            }),
          ]),
      helper.accessor((row) => row.security.code, {
        id: 'security',
        header: t('rfqAgreements.list.columns.security'),
        meta: { width: 'minmax(112px, 1.6fr)' },
        cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
      }),
      ...(bothParties
        ? [
            party('buyer', (row) => row.buyer.organization),
            party('seller', (row) => row.seller.organization),
          ]
        : [
            party('counterparty', (row) => row.counterparty.organization),
            helper.accessor((row) => row.counterpartySvt.name, {
              id: 'counterpartySvt',
              header: t('rfqAgreements.list.columns.counterpartySvt'),
              meta: { width: 'minmax(64px, 1fr)' },
              cell: ({ getValue }) => <span className="text-secondary">{getValue()}</span>,
            }),
          ]),
      helper.accessor('faceAmount', {
        header: t('rfqAgreements.list.columns.faceAmount'),
        meta: { align: 'right', width: '64px' },
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatFace(getValue(), locale)}</span>
        ),
      }),
      helper.accessor('price', {
        header: t('rfqAgreements.list.columns.price'),
        meta: { align: 'right', width: '64px' },
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatQuote(getValue(), locale)}</span>
        ),
      }),
      helper.accessor('settlementAmount', {
        header: t('rfqAgreements.list.columns.settlementAmount'),
        meta: { align: 'right', width: 'minmax(104px, 1.2fr)' },
        cell: ({ getValue }) => (
          <span className="tabular-nums">{format.number(getValue(), 0)}</span>
        ),
      }),
      helper.accessor('settlementDate', {
        header: t('rfqAgreements.list.columns.settlementDate'),
        meta: { width: '48px' },
        cell: ({ getValue }) => (
          <span className="text-secondary tabular-nums">{format.dayMonth(getValue())}</span>
        ),
      }),
      helper.accessor(status, {
        id: 'status',
        header: t('rfqAgreements.list.columns.status'),
        meta: { width: 'minmax(96px, 1fr)' },
        cell: ({ row, getValue }) => (
          <span className={TONE_TEXT[AGREEMENT_TONES[row.original.status]]}>{getValue()}</span>
        ),
      }),
      helper.accessor(
        (row) => (row.emailStatus ? t(`rfqAgreements.emailStatus.${row.emailStatus}`) : ''),
        {
          id: 'emailStatus',
          header: t('rfqAgreements.list.columns.emailStatus'),
          meta: { width: '64px' },
          cell: ({ row, getValue }) =>
            row.original.emailStatus ? (
              <span className={TONE_TEXT[EMAIL_TONES[row.original.emailStatus]]}>{getValue()}</span>
            ) : (
              <span className="text-secondary">—</span>
            ),
        },
      ),
    ])
  }, [bothParties, format, locale, t])

  const exportAs = (kind: 'xlsx' | 'csv') => {
    // Every page of the filters, in the list's order.
    exportList.mutate(
      { query: { ...query, page: undefined, pageSize: undefined }, format: kind },
      {
        onSuccess: (blob) => saveBlob(blob, `cmarket-agreements.${kind}`),
        onError: (error) =>
          toast.error(t('rfqAgreements.list.exportFailed', { message: error.message })),
      },
    )
  }

  const summary = list.data
    ? t('rfqAgreements.list.summary', {
        count: list.data.totalCount,
        face: formatFace(list.data.totalFace, locale),
      })
    : null

  return (
    <Panel
      title={
        <>
          {t('panels.rfqAgreements')}
          {summary && <span className="font-normal normal-case">{` · ${summary}`}</span>}
        </>
      }
      code="RFQ AGR"
      options={
        <span className="flex items-center gap-2 uppercase">
          <span className="text-secondary">{t('rfqAgreements.list.export')}</span>
          {(['xlsx', 'csv'] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => exportAs(kind)}
              disabled={exportList.isPending}
              className="panel-no-drag inline-flex h-6 items-center hover:text-primary disabled:opacity-50"
            >
              {kind}
            </button>
          ))}
        </span>
      }
      bodyClassName="flex flex-col"
    >
      <div className="min-h-0 flex-1">
        <QueryView query={list}>
          {(result) => (
            <DataTable
              data={result.items}
              columns={columns}
              getRowId={getId}
              selectedRowId={selectedId}
              onRowClick={(row) => onSelect(row.id)}
              sorting={sorting}
              onSortingChange={(next) => {
                const [first] = next
                if (first) onSortChange({ id: first.id as RfqAgreementSortKey, desc: first.desc })
              }}
              rowClassName={(row) =>
                row.status === 'cancelled' || row.status === 'expired'
                  ? 'text-secondary'
                  : undefined
              }
              emptyMessage={filtered ? t('rfqAgreements.list.empty') : t('rfqAgreements.list.none')}
            />
          )}
        </QueryView>
      </div>
      {list.data && (
        <Pager
          page={list.data.page}
          pageSize={list.data.pageSize}
          totalCount={list.data.totalCount}
          onChange={onPageChange}
        />
      )}
      <p className="shrink-0 border-t px-2 py-1 font-sans text-data text-secondary">
        {t('rfqAgreements.list.sortedBy', {
          column: t(
            `rfqAgreements.list.columns.${sort.id}` as 'rfqAgreements.list.columns.createdAt',
          ),
          direction: t(
            sort.desc ? 'rfqAgreements.list.descending' : 'rfqAgreements.list.ascending',
          ),
        })}
        {' · '}
        {t('rfqAgreements.list.note')}
      </p>
    </Panel>
  )
}
