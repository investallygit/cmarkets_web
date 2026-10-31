import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEodhdStatus } from '@/entities/data-provider'
import type { EodhdJob, EodhdRunDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { PanelSelect } from '@/shared/ui/PanelSelect'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<EodhdRunDto>()
const getRunId = (run: EodhdRunDto) => run.id

const JOBS: readonly EodhdJob[] = ['us-eod', 'europe-eod', 'fundamentals']
const STATUSES = ['ok', 'failed'] as const

/** EODH: the bulk loads of the last 7 days, filtered by load and by result. */
export function EodhdRunsPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const status = useEodhdStatus()
  const [job, setJob] = useState<EodhdJob | ''>('')
  const [result, setResult] = useState<(typeof STATUSES)[number] | ''>('')

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('startedAt', {
          header: t('eodhd.runs.started'),
          meta: { width: '104px' },
          cell: ({ getValue }) => `${format.dayMonth(getValue())} ${format.time(getValue())}`,
        }),
        helper.accessor((run) => t(`eodhd.jobs.${run.job}`), {
          id: 'job',
          header: t('eodhd.runs.job'),
          meta: { width: '1.3fr' },
        }),
        helper.accessor('durationSeconds', {
          header: t('eodhd.runs.duration'),
          meta: { align: 'right', width: '112px' },
          cell: ({ getValue }) => {
            const seconds = getValue()
            return seconds >= 60
              ? t('eodhd.runs.minutes', {
                  minutes: Math.floor(seconds / 60),
                  seconds: seconds % 60,
                })
              : t('eodhd.runs.seconds', { seconds })
          },
        }),
        helper.accessor('symbols', {
          header: t('eodhd.runs.symbols'),
          meta: { align: 'right', width: '1fr' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
        helper.accessor('calls', {
          header: t('eodhd.runs.calls'),
          meta: { align: 'right', width: '1fr' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
        helper.accessor((run) => t(`eodhd.runs.statuses.${run.status}`), {
          id: 'status',
          header: t('columns.status'),
          meta: { width: '80px' },
          cell: ({ row, getValue }) => (
            <span className={row.original.status === 'ok' ? 'text-up' : 'text-down'}>
              {getValue()}
            </span>
          ),
        }),
        helper.accessor((run) => run.error ?? '', {
          id: 'error',
          header: t('eodhd.runs.error'),
          meta: { width: '2.4fr' },
          cell: ({ getValue }) => (
            <span className="text-down" title={getValue()}>
              {getValue()}
            </span>
          ),
        }),
      ]),
    [t, format],
  )

  return (
    <Panel
      title={t('panels.eodhdRuns')}
      code="EODH"
      options={
        <>
          <PanelSelect
            value={job}
            aria-label={t('eodhd.runs.job')}
            options={[
              { value: '', label: t('eodhd.runs.allJobs') },
              ...JOBS.map((value) => ({ value, label: t(`eodhd.jobs.${value}`) })),
            ]}
            onChange={setJob}
          />
          <PanelSelect
            value={result}
            aria-label={t('columns.status')}
            options={[
              { value: '', label: t('eodhd.runs.allStatuses') },
              ...STATUSES.map((value) => ({ value, label: t(`eodhd.runs.statuses.${value}`) })),
            ]}
            onChange={setResult}
          />
        </>
      }
    >
      <QueryView query={status}>
        {(data) => (
          <DataTable
            data={data.runs.filter(
              (run) => (!job || run.job === job) && (!result || run.status === result),
            )}
            columns={columns}
            getRowId={getRunId}
            exportName="cmarket-eodhd-loads"
            emptyMessage={t('eodhd.runs.none')}
          />
        )}
      </QueryView>
    </Panel>
  )
}
