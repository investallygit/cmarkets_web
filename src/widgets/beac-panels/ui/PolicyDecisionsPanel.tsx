import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { decisionKind, formatBp, rateMoveTone, useBeacDecisions } from '@/entities/beac'
import type { BeacDecisionDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ReleaseDialog } from './ReleaseDialog'

const helper = createDataColumnHelper<BeacDecisionDto>()
const idOf = (decision: BeacDecisionDto) => decision.id

const TONES = { up: 'text-up', down: 'text-down', neutral: 'text-secondary' } as const

/**
 * The Monetary Policy Committee's decisions (screen 34): the meetings announced, then the
 * decisions, newest first, with the policy rate, the marginal lending facility, unchanged or the
 * change in bp (a cut green, a hike red) and the release; a meeting picked shows its release's
 * summary. API /beac/decisions.
 */
export function PolicyDecisionsPanel({ today }: { today: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const decisions = useBeacDecisions()
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [release, setRelease] = useState<BeacDecisionDto | null>(null)
  const picked = decisions.data?.find((decision) => decision.id === pickedId) ?? null
  const illustrative = decisions.data?.some((decision) => decision.illustrative) ?? false

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('date', {
          header: t('beac.decisions.columns.meeting'),
          cell: ({ getValue }) => format.isoDate(getValue()),
        }),
        helper.accessor((decision) => decision.rates?.policy ?? null, {
          id: 'policy',
          header: t('beac.decisions.columns.policy'),
          meta: { align: 'right' },
          cell: ({ row, getValue }) => {
            const value = getValue()
            if (value !== null)
              return <span className="text-accent-amber">{format.percent(value, 2, false)}</span>
            return (
              <span className="text-info">
                {row.original.date >= today
                  ? t('beac.decisions.upcoming')
                  : t('beac.decisions.awaiting')}
              </span>
            )
          },
        }),
        helper.accessor((decision) => decision.rates?.marginalLending ?? null, {
          id: 'lending',
          header: t('beac.decisions.columns.lending'),
          meta: { align: 'right' },
          cell: ({ getValue }) => {
            const value = getValue()
            return value === null ? '—' : format.percent(value, 2, false)
          },
        }),
        helper.accessor((decision) => decision.changeBp, {
          id: 'decision',
          header: t('beac.decisions.columns.decision'),
          meta: { align: 'right' },
          cell: ({ row }) => {
            const kind = decisionKind(row.original)
            if (kind.kind === 'unchanged')
              return <span className="text-secondary">{t('beac.decisions.unchanged')}</span>
            if (kind.kind !== 'move') return '—'
            return (
              <span className={TONES[rateMoveTone(kind.bp)]}>
                {formatBp(kind.bp, t('beac.decisions.bp'))}
              </span>
            )
          },
        }),
        helper.display({
          id: 'doc',
          header: t('beac.decisions.columns.doc'),
          meta: { align: 'right' },
          cell: ({ row }) => {
            const decision = row.original
            const label = t('beac.decisions.openRelease', { date: format.isoDate(decision.date) })
            const linkClass =
              'inline-flex min-h-6 min-w-6 items-center justify-end text-info underline-offset-2 hover:underline'
            if (decision.releaseDocumentId)
              return (
                <button
                  type="button"
                  className={linkClass}
                  aria-label={label}
                  onClick={(event) => {
                    event.stopPropagation()
                    setRelease(decision)
                  }}
                >
                  {t('beac.decisions.pdf')}
                </button>
              )
            if (decision.releaseUrl)
              return (
                <a
                  href={decision.releaseUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={linkClass}
                  aria-label={label}
                  onClick={(event) => event.stopPropagation()}
                >
                  {t('beac.decisions.pdf')}
                </a>
              )
            return '—'
          },
        }),
      ]),
    [t, format, today],
  )

  return (
    <Panel
      title={t('panels.beacDecisions')}
      code="BEAC"
      options={t('beac.decisions.options')}
      bodyClassName="flex flex-col"
    >
      <QueryView
        query={decisions}
        isEmpty={(rows) => rows.length === 0}
        emptyMessage={t('beac.decisions.empty')}
      >
        {(rows) => (
          <DataTable
            data={rows}
            columns={columns}
            getRowId={idOf}
            selectedRowId={pickedId}
            onRowClick={(decision) => setPickedId(decision.id)}
            exportName="beac-mpc-decisions"
          />
        )}
      </QueryView>
      <div
        role="region"
        aria-live="polite"
        aria-label={t('beac.decisions.pick')}
        className="shrink-0 space-y-0.5 border-t px-2 py-1 font-sans text-data"
      >
        {picked ? (
          <>
            <p className="font-semibold text-primary">
              {t('beac.decisions.summaryOf', { date: format.isoDate(picked.date) })}
            </p>
            <p className={clsx(picked.summary ? 'text-primary' : 'text-secondary')}>
              {picked.summary ?? t('beac.decisions.noSummary')}
            </p>
          </>
        ) : (
          <p className="text-secondary">{t('beac.decisions.pick')}</p>
        )}
        <p className="text-title text-secondary">
          {t('beac.decisions.note')}
          {illustrative && ` ${t('beac.decisions.illustrative')}`}
        </p>
      </div>
      <ReleaseDialog
        documentId={release?.releaseDocumentId ?? null}
        title={
          release ? t('beac.decisions.releaseTitle', { date: format.isoDate(release.date) }) : ''
        }
        onClose={() => setRelease(null)}
      />
    </Panel>
  )
}
