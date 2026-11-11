import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnomalyClicks, useDecideAnomaly } from '@/entities/news-statement'
import type { AnomalyClickDto, ClickAnomalyDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Dialog } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'

const helper = createDataColumnHelper<AnomalyClickDto>()
const getId = (click: AnomalyClickDto) => `${click.newsId}:${click.user.id}`

/**
 * The actions of the anomaly to handle (the screen 18 mockup): invalidate its clicks, or keep them
 * with a reason (both audited; the statement is computed again), and its clicks in detail.
 */
export function AnomalyActions({ anomaly }: { anomaly: ClickAnomalyDto }) {
  const { t } = useTranslation()
  const decide = useDecideAnomaly()
  const [asking, setAsking] = useState<'invalidate' | 'keep' | null>(null)
  const [details, setDetails] = useState(false)
  const open = anomaly.decision === 'open'
  const count = anomaly.clicks

  return (
    <div className="flex flex-wrap items-center gap-2">
      {open && (
        <>
          <Button variant="danger" onClick={() => setAsking('invalidate')}>
            {t('mediaPayments.anomalies.invalidate', { count })}
          </Button>
          <Button variant="secondary" onClick={() => setAsking('keep')}>
            {t('mediaPayments.anomalies.keep')}
          </Button>
        </>
      )}
      <Button variant="secondary" onClick={() => setDetails(true)}>
        {t('mediaPayments.anomalies.details')}
      </Button>
      <ConfirmDialog
        open={asking !== null}
        onClose={() => setAsking(null)}
        title={t(
          asking === 'keep'
            ? 'mediaPayments.anomalies.keepTitle'
            : 'mediaPayments.anomalies.invalidateTitle',
          { count },
        )}
        message={t('mediaPayments.anomalies.note')}
        confirmLabel={
          asking === 'keep'
            ? t('mediaPayments.anomalies.keep')
            : t('mediaPayments.anomalies.invalidate', { count })
        }
        tone={asking === 'keep' ? 'primary' : 'danger'}
        requireReason
        busy={decide.isPending}
        onConfirm={(reason) => {
          const decision = asking === 'keep' ? 'keep' : 'invalidate'
          decide.mutate(
            { id: anomaly.id, decision: { decision, reason } },
            {
              onSuccess: () => {
                setAsking(null)
                toast.success(
                  t(
                    decision === 'keep'
                      ? 'mediaPayments.anomalies.kept'
                      : 'mediaPayments.anomalies.invalidated',
                  ),
                )
              },
              onError: (error) => toast.error(error.message),
            },
          )
        }}
      />
      <Dialog
        open={details}
        onClose={() => setDetails(false)}
        title={t('mediaPayments.anomalies.clicksTitle')}
        width={880}
      >
        {details && <AnomalyClicks id={anomaly.id} />}
      </Dialog>
    </div>
  )
}

/** The clicks an anomaly concerns: when, which item, which account, from where, excluded or not. */
function AnomalyClicks({ id }: { id: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const clicks = useAnomalyClicks(id)
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('viewedAt', {
          header: t('mediaPayments.anomalies.clicksColumns.at'),
          meta: { width: '128px' },
          cell: ({ getValue }) => `${format.date(getValue())} ${format.time(getValue())}`,
        }),
        helper.accessor('headline', {
          header: t('mediaPayments.anomalies.clicksColumns.item'),
          meta: { width: '2fr' },
        }),
        helper.accessor((click) => click.user.displayName, {
          id: 'account',
          header: t('mediaPayments.anomalies.clicksColumns.account'),
          meta: { width: '1fr' },
        }),
        helper.accessor((click) => click.ipAddress ?? '—', {
          id: 'address',
          header: t('mediaPayments.anomalies.clicksColumns.address'),
          meta: { width: '120px' },
        }),
        helper.accessor(
          (click) =>
            click.exclusion ? t(`mediaPayments.anomalies.exclusions.${click.exclusion}`) : '—',
          {
            id: 'exclusion',
            header: t('mediaPayments.anomalies.clicksColumns.exclusion'),
            meta: { width: '120px' },
          },
        ),
      ]),
    [t, format],
  )
  return (
    <QueryView query={clicks}>
      {(list) => (
        <div className="h-[60vh]">
          <DataTable data={list} columns={columns} getRowId={getId} exportName="anomaly-clicks" />
        </div>
      )}
    </QueryView>
  )
}
