import { clsx } from 'clsx'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  checkResult,
  formatCountdown,
  formatFace,
  formatQuote,
  quoteDecimals,
  shortNumber,
  timeLeft,
  useServerNow,
  useSvtApprovals,
  useSvtSummary,
  type CheckResult,
} from '@/entities/rfq'
import type { SvtApprovalItemDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { DataTable } from '@/shared/ui/DataTable'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { reasonText } from '../lib/reasonText'

const helper = createDataColumnHelper<SvtApprovalItemDto>()

/** 15 minutes: the reminder's, when the time left turns red. */
const DUE_SOON = 15 * 60_000

const CHECK_TONES: Record<CheckResult, string> = {
  ok: 'text-up',
  limit: 'text-down',
  link: 'text-down',
}

interface ApprovalsPanelProps {
  /** The agreement the detail shows; null: the first to approve. */
  selectedId: string | null
  onSelect: (agreementId: string) => void
}

/**
 * Screen 27's "Agreements to approve" and "Latest decisions" (spec section 9; API /svt/approvals):
 * the bank's agreements waiting, the soonest due first, with the time left, its client and side,
 * the security, the face, the price or rate, the counterparty and its SVT, and the checks on the
 * client ("Limit": over its daily limit; flagged, the decision stays the SVT's); then the bank's
 * decisions of the day with their author and reason. A row picked shows in the detail.
 */
export function ApprovalsPanel({ selectedId, onSelect }: ApprovalsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const now = useServerNow()
  const summary = useSvtSummary()
  const pending = useSvtApprovals({ status: 'pending' })
  const approvalWindow = summary.data?.window

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('number', {
          header: t('svt.approvals.columns.agreement'),
          meta: { width: '80px' },
          cell: ({ getValue }) => <span className="text-info">{shortNumber(getValue())}</span>,
        }),
        helper.accessor((item) => Date.parse(item.confirmedAt), {
          id: 'confirmed',
          header: t('svt.approvals.columns.confirmed'),
          meta: { width: '80px' },
          cell: ({ row }) => (
            <span className="tabular-nums">{format.time(row.original.confirmedAt)}</span>
          ),
        }),
        helper.accessor((item) => timeLeft(item.deadline, now), {
          id: 'left',
          header: t('svt.approvals.columns.left'),
          // "65:59:00" when the deadline is the next business day's (after the cut-off, a weekend).
          meta: { align: 'right', width: '80px' },
          cell: ({ getValue }) => (
            <span
              className={clsx(
                'tabular-nums',
                getValue() < DUE_SOON ? 'text-down' : 'text-accent-amber',
              )}
            >
              {formatCountdown(getValue())}
            </span>
          ),
        }),
        helper.accessor(
          (item) =>
            item.clients.map(({ client }) => `${client.name} · ${client.organization}`).join(' / '),
          {
            id: 'client',
            header: t('svt.approvals.columns.client'),
            // The rest of the width: the security and the counterparty keep theirs whole.
            meta: { width: 'minmax(150px, 4fr)' },
          },
        ),
        helper.accessor((item) => item.clients.map((client) => client.side).join(' / '), {
          id: 'side',
          header: t('svt.approvals.columns.side'),
          meta: { width: '88px' },
          cell: ({ row }) => (
            <span>
              {row.original.clients.map((client, index) => (
                <span key={client.side}>
                  {index > 0 && ' / '}
                  <span className={client.side === 'buy' ? 'text-up' : 'text-down'}>
                    {t(`rfqTrading.sideUpper.${client.side}`)}
                  </span>
                </span>
              ))}
            </span>
          ),
        }),
        helper.accessor((item) => item.security.code, {
          id: 'security',
          header: t('svt.approvals.columns.security'),
          meta: { width: 'minmax(150px, 1fr)' },
          cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
        }),
        helper.accessor('faceAmount', {
          header: t('svt.approvals.columns.face'),
          meta: { align: 'right', width: '68px' },
          cell: ({ getValue }) => (
            <span className="tabular-nums">{formatFace(getValue(), format.locale)}</span>
          ),
        }),
        helper.accessor(
          (item) => (item.security.instrument === 'BTA' ? item.ratePct : item.price),
          {
            id: 'quote',
            header: t('svt.approvals.columns.quote'),
            meta: { align: 'right', width: '92px' },
            cell: ({ row }) => {
              const { security, price, ratePct } = row.original
              return (
                <span className="tabular-nums">
                  {security.instrument === 'BTA'
                    ? format.percent(ratePct, quoteDecimals(ratePct), false)
                    : formatQuote(price, format.locale)}
                </span>
              )
            },
          },
        ),
        helper.accessor(
          (item) =>
            item.counterparty && item.counterpartySvt
              ? `${item.counterparty.organization} · ${item.counterpartySvt.name}`
              : '',
          {
            id: 'counterparty',
            header: t('svt.approvals.columns.counterparty'),
            meta: { width: 'minmax(134px, 1fr)' },
            cell: ({ getValue }) =>
              getValue() || <span className="text-secondary">{t('svt.approvals.bothLegs')}</span>,
          },
        ),
        helper.accessor((item) => checkResult(item.clients), {
          id: 'checks',
          header: t('svt.approvals.columns.checks'),
          meta: { width: 'minmax(72px, 1fr)' },
          cell: ({ row, getValue }) => (
            <span>
              <span className={CHECK_TONES[getValue()]}>{t(`svt.checks.${getValue()}`)}</span>
              {row.original.fourEyes && (
                <span className="text-secondary"> · {t('svt.approvals.fourEyes')}</span>
              )}
            </span>
          ),
        }),
      ]),
    [format, now, t],
  )

  return (
    <Panel
      title={t('panels.svtApprovals')}
      code="SVT"
      options={
        approvalWindow && (
          <span>
            {t('svt.window', {
              minutes: approvalWindow.minutes,
              cutOff: approvalWindow.cutOffTime.slice(0, 5),
            })}
          </span>
        )
      }
    >
      <QueryView query={pending}>
        {(items) => (
          <div className="flex min-h-0 flex-1 flex-col overflow-auto">
            <DataTable
              data={items}
              columns={columns}
              getRowId={(item) => item.agreementId}
              selectedRowId={selectedId ?? items[0]?.agreementId ?? null}
              onRowClick={(item) => onSelect(item.agreementId)}
              emptyMessage={t('svt.approvals.empty')}
              exportName="svt-approvals"
            />
            <p className="px-3 py-2 font-sans text-data text-secondary">
              {t('svt.approvals.note')}
            </p>
            <LatestDecisions onSelect={onSelect} />
          </div>
        )}
      </QueryView>
    </Panel>
  )
}

/** The bank's decisions of the day, newest first: "10:31 ACC-0013 approved by B. Sima · agreement concluded, PDF sent". */
function LatestDecisions({ onSelect }: { onSelect: (agreementId: string) => void }) {
  const { t } = useTranslation()
  const format = useFormat()
  const decided = useSvtApprovals({ status: 'decided' })
  const items = decided.data ?? []

  return (
    <section aria-labelledby="svt-latest-decisions" className="flex flex-col px-3 pb-2">
      <h3
        id="svt-latest-decisions"
        className="pb-1 font-sans text-label font-semibold tracking-title text-accent-amber uppercase"
      >
        {t('svt.decisions.title')}
      </h3>
      {items.length === 0 ? (
        <p className="font-sans text-data text-secondary">{t('svt.decisions.empty')}</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.agreementId}>
              <button
                type="button"
                onClick={() => onSelect(item.agreementId)}
                className="flex min-h-6 w-full items-baseline gap-3 text-left font-mono text-data hover:bg-panel-header"
              >
                <span className="shrink-0 text-secondary tabular-nums">
                  {item.decision?.decidedAt ? format.time(item.decision.decidedAt) : '—'}
                </span>
                <DecisionText item={item} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** What became of an agreement the bank approved: concluded, or waiting for, rejected or let expire by the other SVT. */
const AFTER_APPROVAL = {
  awaitingSvt: 'svt.decisions.waiting',
  concluded: 'svt.decisions.concluded',
  cancelled: 'svt.decisions.concluded',
  rejected: 'svt.decisions.otherRejected',
  expired: 'svt.decisions.otherExpired',
} as const satisfies Record<SvtApprovalItemDto['agreementStatus'], string>

function DecisionText({ item }: { item: SvtApprovalItemDto }) {
  const { t } = useTranslation()
  const decision = item.decision
  const number = shortNumber(item.number)
  const name = decision?.decidedBy ?? ''
  if (decision?.status === 'approved')
    return (
      <span className="text-up">
        {t('svt.decisions.approved', { number, name })} · {t(AFTER_APPROVAL[item.agreementStatus])}
      </span>
    )
  if (decision?.status === 'rejected')
    return (
      <span className="text-down">
        {t('svt.decisions.rejected', { number, name, reason: reasonText(t, decision) })}
      </span>
    )
  return <span className="text-secondary">{t('svt.decisions.expired', { number })}</span>
}
