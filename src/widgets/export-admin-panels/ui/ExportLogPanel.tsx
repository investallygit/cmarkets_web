import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useExportLog } from '@/entities/data-export'
import {
  EXPORT_DATASETS,
  type AccountType,
  type ExportDatasetCode,
  type ExportLogRowDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Select } from '@/shared/ui/form/Select'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<ExportLogRowDto>()
const ALL = ''

/**
 * USER's download log (spec section 9, screen 30: "every download is logged (user, dataset,
 * settings, number of rows) for licence tracking"): the period (the last 30 days at first) and a
 * dataset, newest first, exported as the other tables are.
 */
export function ExportLogPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const [from, setFrom] = useState<string | null>(null)
  const [to, setTo] = useState<string | null>(null)
  const [dataset, setDataset] = useState<ExportDatasetCode | typeof ALL>(ALL)
  const log = useExportLog({
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(dataset ? { dataset } : {}),
  })
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('createdAt', {
          header: t('downloads.log.date'),
          cell: ({ getValue }) => `${format.date(getValue())} ${format.time(getValue())}`,
        }),
        helper.accessor('user', { header: t('downloads.log.user') }),
        helper.accessor('accountType', {
          header: t('downloads.log.profile'),
          cell: ({ getValue }) => t(`accountBadge.${getValue() as AccountType}`),
        }),
        helper.accessor('dataset', {
          header: t('downloads.log.dataset'),
          cell: ({ getValue }) => t(`downloads.datasets.${getValue()}.name`),
        }),
        helper.accessor('summary', { header: t('downloads.log.settings') }),
        helper.accessor('format', {
          header: t('downloads.format'),
          cell: ({ getValue }) => getValue().toUpperCase(),
        }),
        helper.accessor('rows', {
          header: t('downloads.log.rows'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
        helper.accessor('status', {
          header: t('downloads.log.status'),
          cell: ({ getValue }) =>
            getValue() === 'deleted'
              ? t('downloads.log.deleted')
              : getValue() === 'inProgress'
                ? t('downloads.mine.inProgress', { progress: '…' })
                : t(`downloads.mine.${getValue() as 'ready'}`),
        }),
      ]),
    [t, format],
  )
  return (
    <Panel title={t('panels.exportLog')} code="USER" bodyClassName="flex flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b px-2 py-1.5 font-sans text-data">
        <label className="flex items-center gap-2 text-secondary">
          {t('downloads.from')}
          <DateInput value={from} onChange={setFrom} className="w-36" />
        </label>
        <label className="flex items-center gap-2 text-secondary">
          {t('downloads.to')}
          <DateInput value={to} onChange={setTo} className="w-36" />
        </label>
        <Select<ExportDatasetCode | typeof ALL>
          aria-label={t('downloads.log.dataset')}
          value={dataset}
          options={[
            { value: ALL, label: t('downloads.log.allDatasets') },
            ...EXPORT_DATASETS.map((code) => ({
              value: code,
              label: t(`downloads.datasets.${code}.name`),
            })),
          ]}
          onChange={setDataset}
          className="w-48"
        />
      </div>
      <QueryView query={log}>
        {(rows) => (
          <div className="min-h-0 flex-1">
            <DataTable
              data={rows}
              columns={columns}
              getRowId={(row) => row.id}
              exportName="download-log"
              emptyMessage={t('downloads.log.none')}
            />
          </div>
        )}
      </QueryView>
    </Panel>
  )
}
