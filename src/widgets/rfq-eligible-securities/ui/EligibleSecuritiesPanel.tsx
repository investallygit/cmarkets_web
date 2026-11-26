import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { countryCode3, useRfqEligiblePreview, useRfqRequestEligible } from '@/entities/rfq'
import type { RfqEligibleQuery, RfqEligibleSecurityDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { DataTable } from '@/shared/ui/DataTable'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/** Whose eligible securities show: a request by criteria's, or the new request's preview. */
export type EligibleSource =
  { kind: 'request'; id: string; number: string } | { kind: 'preview'; query: RfqEligibleQuery }

const helper = createDataColumnHelper<RfqEligibleSecurityDto>()

/**
 * Screen 22's "Eligible securities" (sixth version, the mockup's right-hand panel; ROADMAP decision
 * 49): the outstanding securities a request by criteria accepts with their last computed yield,
 * highest first, as drawn at its publication, or the new request's preview while its criteria are
 * entered; in the place of "My SVTs", which it gives back.
 */
export function EligibleSecuritiesPanel({
  source,
  onClose,
}: {
  source: EligibleSource
  onClose: () => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const ofRequest = useRfqRequestEligible(source.kind === 'request' ? source.id : null)
  const preview = useRfqEligiblePreview(source.kind === 'preview' ? source.query : null)
  const query = source.kind === 'request' ? ofRequest : preview
  const count = query.data?.length

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor((item) => item.security.code, {
          id: 'security',
          header: t('rfqCriteria.eligiblePanel.columns.security'),
          meta: { width: 'minmax(120px, 2fr)' },
          cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
        }),
        helper.accessor((item) => countryCode3(item.security.country), {
          id: 'country',
          header: t('rfqCriteria.eligiblePanel.columns.country'),
          meta: { width: '64px' },
        }),
        helper.accessor('remainingYears', {
          header: t('rfqCriteria.eligiblePanel.columns.maturity'),
          meta: { align: 'right', width: '72px' },
          cell: ({ getValue }) => (
            <span className="tabular-nums">{format.number(getValue(), 2)}</span>
          ),
        }),
        helper.accessor('yieldPct', {
          header: t('rfqCriteria.eligiblePanel.columns.yield'),
          meta: { align: 'right', width: 'minmax(72px, 1fr)' },
          cell: ({ getValue }) => (
            <span className="tabular-nums text-primary">{`${format.number(getValue(), 2)}%`}</span>
          ),
        }),
      ]),
    [format, t],
  )

  return (
    <Panel
      title={
        source.kind === 'request'
          ? `${t('rfqCriteria.eligiblePanel.title')} · ${source.number}`
          : t('rfqCriteria.eligiblePanel.title')
      }
      code="RFQ"
      options={
        count !== undefined && <span>{t('rfqCriteria.eligiblePanel.count', { count })}</span>
      }
    >
      <QueryView query={query}>
        {(data) => (
          <div className="flex min-h-0 flex-1 flex-col overflow-auto">
            <div className="flex min-h-0 flex-1 flex-col">
              <DataTable
                data={data}
                columns={columns}
                getRowId={(item) => item.security.id}
                emptyMessage={t('rfqCriteria.eligiblePanel.empty')}
                exportName={
                  source.kind === 'request' ? `${source.number}-eligible` : 'rfq-eligible'
                }
              />
            </div>
            <div className="flex shrink-0 flex-col gap-2 p-2">
              <p className="font-sans text-label text-secondary">
                {t('rfqCriteria.eligiblePanel.note')}
                {source.kind === 'preview' && ` ${t('rfqCriteria.eligiblePanel.preview')}`}
              </p>
              <Button variant="secondary" className="self-start" onClick={onClose}>
                {t('rfqCriteria.eligiblePanel.close')}
              </Button>
            </div>
          </div>
        )}
      </QueryView>
    </Panel>
  )
}
