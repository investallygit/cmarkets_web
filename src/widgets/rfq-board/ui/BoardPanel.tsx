import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CompletionRatio,
  formatCountdown,
  formatFace,
  RESPONSE_TONES,
  shortNumber,
  useDescribeCriteria,
  useRfqBoard,
  useRfqSetup,
  useServerNow,
} from '@/entities/rfq'
import { RfqAnswerForm } from '@/features/answer-rfq'
import type { RfqBoardItemDto } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'
import { DataTable } from '@/shared/ui/DataTable'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<RfqBoardItemDto>()

/**
 * Screen 22's "Open requests on the platform" (spec section 9; API /rfq/board): the other traders'
 * requests, the soonest to end first, with the time each has left and the trader's answer; an
 * anonymous requester hidden. The request picked gets the answer form under the table; a
 * colleague's is read, not answered, and a trader without a confirmed SVT reads the board only.
 * A request by criteria shows its criteria in place of a security (sixth version); picked, the
 * page shows its eligible securities beside it.
 */
export function BoardPanel({
  onPick,
}: {
  onPick?: (request: Pick<RfqBoardItemDto, 'id' | 'number' | 'mode'>) => void
}) {
  const { t } = useTranslation()
  const describe = useDescribeCriteria()
  const locale = useLocale()
  const board = useRfqBoard()
  const setup = useRfqSetup()
  const now = useServerNow()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const requests = board.data?.requests ?? []
  const selected = requests.find((request) => request.id === selectedId) ?? null
  const open = requests.filter((request) => Date.parse(request.closesAt) > now).length

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('number', {
          header: t('rfqTrading.board.columns.request'),
          meta: { width: 'minmax(84px, 1fr)' },
          cell: ({ getValue }) => <span className="text-primary">{shortNumber(getValue())}</span>,
        }),
        helper.accessor(
          (request) =>
            request.requester
              ? `${request.requester.name} · ${request.requester.organization}`
              : '',
          {
            id: 'requester',
            header: t('rfqTrading.board.columns.requester'),
            meta: { width: 'minmax(120px, 2fr)' },
            // With the requester's organisation's ratio as a requester, named or not (sixth
            // version, ROADMAP decision 53): "Anonymous · 93%".
            cell: ({ getValue, row }) => (
              <span className="flex min-w-0 items-baseline gap-1">
                {getValue() ? (
                  <span className="truncate">{getValue()}</span>
                ) : (
                  <span className="text-secondary">{t('rfqTrading.board.anonymous')}</span>
                )}
                {row.original.requesterCompletion && (
                  <>
                    <span className="text-secondary">·</span>
                    <CompletionRatio
                      completion={row.original.requesterCompletion}
                      withCases={false}
                    />
                  </>
                )}
              </span>
            ),
          },
        ),
        helper.accessor('side', {
          header: t('rfqTrading.board.columns.side'),
          meta: { width: '56px' },
          cell: ({ getValue }) => (
            <span className={getValue() === 'buy' ? 'text-up' : 'text-down'}>
              {t(`rfqTrading.sideUpper.${getValue()}`)}
            </span>
          ),
        }),
        helper.accessor(
          (request) =>
            request.security?.code ??
            (request.criteria
              ? t('rfqCriteria.describe.prefix', { criteria: describe(request.criteria).short })
              : ''),
          {
            id: 'security',
            header: t('rfqTrading.board.columns.security'),
            meta: { width: 'minmax(140px, 2fr)' },
            cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
          },
        ),
        helper.accessor('faceAmount', {
          header: t('rfqTrading.board.columns.face'),
          meta: { align: 'right', width: 'minmax(64px, 1fr)' },
          cell: ({ getValue }) => (
            <span className="tabular-nums">{formatFace(getValue(), locale)}</span>
          ),
        }),
        helper.accessor((request) => Date.parse(request.closesAt), {
          id: 'left',
          header: t('rfqTrading.board.columns.left'),
          meta: { align: 'right', width: '64px' },
          cell: ({ getValue }) =>
            getValue() > now ? (
              <span className="tabular-nums text-accent-amber">
                {formatCountdown(getValue() - now)}
              </span>
            ) : (
              <span className="text-secondary">{t('rfqTrading.board.closed')}</span>
            ),
        }),
        helper.accessor((request) => request.myResponse?.status ?? '', {
          id: 'mine',
          header: t('rfqTrading.board.columns.mine'),
          meta: { width: 'minmax(96px, 1fr)' },
          cell: ({ row }) => {
            const { myResponse, ownOrganization } = row.original
            if (ownOrganization)
              return <span className="text-secondary">{t('rfqTrading.board.ownOrganization')}</span>
            if (!myResponse) return '–'
            return (
              <Badge tone={RESPONSE_TONES[myResponse.status]}>
                {t(`rfqTrading.responseStatus.${myResponse.status}`)}
              </Badge>
            )
          },
        }),
      ]),
    [describe, locale, now, t],
  )

  return (
    <Panel
      title={t('panels.rfqBoard')}
      code="RFQ BOARD"
      options={<span>{t('rfqTrading.board.open', { count: open })}</span>}
    >
      <QueryView query={board}>
        {(data) => (
          <div className="flex min-h-0 flex-1 flex-col overflow-auto">
            <div className={clsx('flex min-h-0 flex-col', selected ? 'max-h-56' : 'flex-1')}>
              <DataTable
                data={data.requests}
                columns={columns}
                getRowId={(request) => request.id}
                selectedRowId={selected?.id ?? null}
                onRowClick={(request) => {
                  setSelectedId(request.id)
                  onPick?.(request)
                }}
                emptyMessage={t('rfqTrading.board.empty')}
                exportName="rfq-board"
              />
            </div>
            {selected && setup.data ? (
              <RfqAnswerForm
                key={`${selected.id}-${selected.myResponse?.id ?? ''}-${selected.myResponse?.version ?? 0}`}
                request={selected}
                svts={setup.data.svts}
                canAnswer={data.canAnswer}
                minimumTradingAmount={setup.data.minimumTradingAmount}
              />
            ) : (
              data.requests.length > 0 && (
                <p className="p-2 font-sans text-label text-secondary">
                  {data.canAnswer ? t('rfqTrading.board.hint') : t('rfqTrading.board.readOnly')}
                </p>
              )
            )}
          </div>
        )}
      </QueryView>
    </Panel>
  )
}
