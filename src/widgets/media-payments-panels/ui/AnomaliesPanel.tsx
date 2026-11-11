import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  anomalyItems,
  anomalySignal,
  anomalyToHandle,
  useClickAnomalies,
} from '@/entities/news-statement'
import { AnomalyActions } from '@/features/decide-click-anomaly'
import type { ClickAnomalyDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<ClickAnomalyDto>()
const getId = (anomaly: ClickAnomalyDto) => anomaly.id

const DECISION_TEXT: Record<ClickAnomalyDto['decision'], string> = {
  open: 'text-down',
  invalidated: 'text-secondary',
  kept: 'text-up',
  excludedByRule: 'text-secondary',
}

interface AnomaliesPanelProps {
  month: string
  /** The newspaper of the statement picked; null before one is. */
  source: { id: string; shortName: string } | null
}

/**
 * The click anomalies of the newspaper picked (the screen 18 mockup): the day, the signal (a
 * spike, accounts on one address, new accounts), the items, the clicks and the decision; the
 * actions on the one picked, else the first still open.
 */
export function AnomaliesPanel({ month, source }: AnomaliesPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const anomalies = useClickAnomalies(month, source?.id ?? null)
  const [pickedId, setPickedId] = useState<string | null>(null)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('day', {
          header: t('mediaPayments.anomalies.columns.date'),
          meta: { width: '64px' },
          cell: ({ getValue }) => format.isoDate(getValue()).slice(0, 5),
        }),
        helper.accessor((anomaly) => anomaly.signal, {
          id: 'signal',
          header: t('mediaPayments.anomalies.columns.signal'),
          meta: { width: '1.4fr' },
          cell: ({ row }) => {
            const { key, values } = anomalySignal(row.original)
            return <span className="text-warning">{t(key, values)}</span>
          },
        }),
        helper.accessor((anomaly) => anomaly.itemCount, {
          id: 'items',
          header: t('mediaPayments.anomalies.columns.items'),
          meta: { width: '2fr' },
          cell: ({ row }) => {
            const items = anomalyItems(row.original)
            return 'headline' in items
              ? `“${items.headline}”`
              : t(items.key, 'count' in items ? { count: items.count } : {})
          },
        }),
        helper.accessor('clicks', {
          header: t('mediaPayments.anomalies.columns.clicks'),
          meta: { align: 'right', width: '72px' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
        helper.accessor((anomaly) => t(`mediaPayments.anomalies.decisions.${anomaly.decision}`), {
          id: 'decision',
          header: t('mediaPayments.anomalies.columns.decision'),
          meta: { width: '1fr' },
          cell: ({ row, getValue }) => (
            <span className={DECISION_TEXT[row.original.decision]}>{getValue()}</span>
          ),
        }),
      ]),
    [t, format],
  )

  return (
    <Panel
      title={
        source
          ? t('mediaPayments.anomalies.title', { source: source.shortName })
          : t('panels.clickAnomalies')
      }
      code="MPAY"
      options={<span className="uppercase">{t('mediaPayments.anomalies.detection')}</span>}
    >
      {source === null ? (
        <p className="p-3 font-sans text-data text-secondary">
          {t('mediaPayments.anomalies.choose')}
        </p>
      ) : (
        <QueryView query={anomalies}>
          {(list) => {
            const handled = anomalyToHandle(list, pickedId)
            return (
              <div className="flex h-full min-h-0 flex-col">
                <div className="min-h-0 flex-1">
                  <DataTable
                    data={list}
                    columns={columns}
                    getRowId={getId}
                    selectedRowId={handled?.id ?? null}
                    onRowClick={(anomaly) => setPickedId(anomaly.id)}
                    exportName={`click-anomalies-${source.shortName}-${month}`}
                    emptyMessage={t('mediaPayments.anomalies.none')}
                  />
                </div>
                <div className="flex flex-col gap-2 border-t border-border px-3 py-2">
                  {handled && <AnomalyActions anomaly={handled} />}
                  <p className="font-sans text-caption text-secondary">
                    {t('mediaPayments.anomalies.note')}
                  </p>
                </div>
              </div>
            )
          }}
        </QueryView>
      )}
    </Panel>
  )
}
