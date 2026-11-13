import { FolderOpen, Undo2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  IMPORT_TYPES,
  RETIRED_IMPORT_TYPES,
  ImportStatusText,
  importStatusLabel,
  isImportType,
  useImports,
  type ImportQuery,
} from '@/entities/data-import'
import { useRollBack } from '@/features/roll-back-import'
import type { ImportDto, ImportStatus } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { addDays } from '@/shared/lib/isoDate'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Select } from '@/shared/ui/form/Select'
import type { MenuItem } from '@/shared/ui/menu'
import { Pager } from '@/shared/ui/Pager'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<ImportDto>()
const getImportId = (upload: ImportDto) => upload.id

/** The history of the screen 6 mockup covers the last 7 days. */
const RECENT_DAYS = 7
const PAGE_SIZE = 50

const STATUSES: readonly ImportStatus[] = [
  'checks',
  'ready',
  'published',
  'rolledBack',
  'discarded',
]

interface UploadHistoryPanelProps {
  /** recent: the last 7 days (IMP); full: filters and pages (HIST); session: one session (DATA). */
  variant: 'recent' | 'full' | 'session'
  /** The session of the session variant. */
  sessionDate?: string | null
  selectedId?: string | null
  onOpen: (upload: ImportDto) => void
}

/**
 * Screen 6, upload history (GET /data/imports): date, type, file, rows, status and author; a click
 * opens the upload, the right-click menu rolls back a publication with a reason.
 */
export function UploadHistoryPanel({
  variant,
  sessionDate = null,
  selectedId = null,
  onOpen,
}: UploadHistoryPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const today = useMarketDay()
  const [params, updateParams] = useSearchParamsUpdate()
  const [page, setPage] = useState(1)
  const rollBack = useRollBack()

  // The full history keeps its filters in the URL.
  const typeParam = params.get('type') ?? ''
  const statusParam = params.get('status') ?? ''
  const filters: ImportQuery =
    variant === 'full'
      ? {
          type: isImportType(typeParam) ? typeParam : undefined,
          status: STATUSES.find((status) => status === statusParam)
            ? statusParam === 'checks'
              ? ['format', 'checks']
              : [statusParam as ImportStatus]
            : undefined,
          from: params.get('from') ?? undefined,
          to: params.get('to') ?? undefined,
        }
      : variant === 'session'
        ? { sessionDate: sessionDate ?? undefined }
        : { from: addDays(today, -RECENT_DAYS) }
  const imports = useImports({
    ...filters,
    page: variant === 'full' ? page : 1,
    pageSize: PAGE_SIZE,
  })
  const setFilter = (values: Record<string, string>) => {
    setPage(1)
    updateParams((current) => withParams(current, values))
  }

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('uploadedAt', {
          header: t('columns.date'),
          meta: { width: '96px' },
          cell: ({ getValue }) => `${format.dayMonth(getValue())} ${format.time(getValue())}`,
        }),
        helper.accessor((upload) => t(`dataImport.types.${upload.type}`), {
          id: 'type',
          header: t('columns.type'),
          meta: { width: '1.3fr' },
        }),
        helper.accessor('fileName', {
          header: t('dataImport.history.file'),
          meta: { width: '1.7fr' },
          cell: ({ getValue }) => (
            <span className="text-info" title={getValue()}>
              {getValue()}
            </span>
          ),
        }),
        ...(variant === 'full'
          ? [
              helper.accessor('sessionDate', {
                header: t('dataImport.history.session'),
                meta: { width: '88px' },
                cell: ({ getValue }) => format.isoDate(getValue()),
              }),
            ]
          : []),
        helper.accessor((upload) => upload.counts.read, {
          id: 'rows',
          header: t('dataImport.history.rows'),
          meta: { align: 'right', width: '56px' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
        helper.accessor((upload) => t(`dataImport.status.${importStatusLabel(upload)}`), {
          id: 'status',
          header: t('columns.status'),
          meta: { width: '1.4fr' },
          cell: ({ row }) => <ImportStatusText upload={row.original} />,
        }),
        helper.accessor('uploadedBy', {
          header: t('dataImport.history.by'),
          meta: { width: '1fr' },
        }),
      ]),
    [t, format, variant],
  )

  const rowMenu = (upload: ImportDto): MenuItem[] => [
    {
      id: 'open',
      label: t('dataImport.history.open'),
      icon: FolderOpen,
      onSelect: () => onOpen(upload),
    },
    ...(upload.status === 'published'
      ? [
          {
            id: 'roll-back',
            label: t('dataImport.history.rollBack'),
            icon: Undo2,
            onSelect: () => rollBack.ask(upload),
          },
        ]
      : []),
  ]

  return (
    <Panel
      title={variant === 'session' ? t('panels.sessionUploads') : t('panels.uploadHistory')}
      code="HIST"
      options={
        variant === 'recent' && (
          <span>{t('dataImport.history.lastDays', { count: RECENT_DAYS })}</span>
        )
      }
      bodyClassName="flex flex-col"
    >
      {variant === 'full' && (
        <div className="flex flex-wrap items-center gap-2 border-b p-2">
          <Select
            value={isImportType(typeParam) ? typeParam : ''}
            prefix={t('dataImport.history.typeFilter')}
            aria-label={t('dataImport.upload.fileType')}
            options={[
              { value: '', label: t('dataImport.history.allTypes') },
              // The weekly curves file of the first versions stays a filter: its uploads are in the history.
              ...[...IMPORT_TYPES, ...RETIRED_IMPORT_TYPES].map((value) => ({
                value,
                label: t(`dataImport.types.${value}`),
              })),
            ]}
            onChange={(value) => setFilter({ type: value })}
            className="w-56"
          />
          <Select
            value={STATUSES.find((status) => status === statusParam) ?? ''}
            prefix={t('dataImport.history.statusFilter')}
            aria-label={t('columns.status')}
            options={[
              { value: '', label: t('dataImport.history.allStatuses') },
              ...STATUSES.map((value) => ({ value, label: t(`dataImport.status.${value}`) })),
            ]}
            onChange={(value) => setFilter({ status: value })}
            className="w-52"
          />
          <span className="ml-2 font-sans text-data text-secondary">
            {t('dataImport.history.from')}
          </span>
          <DateInput
            value={filters.from ?? null}
            onChange={(value) => setFilter({ from: value ?? '' })}
            aria-label={t('dataImport.history.from')}
            className="w-28"
          />
          <span className="font-sans text-data text-secondary">{t('dataImport.history.to')}</span>
          <DateInput
            value={filters.to ?? null}
            onChange={(value) => setFilter({ to: value ?? '' })}
            aria-label={t('dataImport.history.to')}
            className="w-28"
          />
        </div>
      )}
      <div className="min-h-0 flex-1">
        <QueryView query={imports}>
          {(result) => (
            <DataTable
              data={result.items}
              columns={columns}
              getRowId={getImportId}
              selectedRowId={selectedId}
              onRowClick={onOpen}
              rowMenu={rowMenu}
              exportName="cmarket-uploads"
              emptyMessage={t('dataImport.history.none')}
            />
          )}
        </QueryView>
      </div>
      {variant === 'full' && imports.data && (
        <Pager
          page={imports.data.page}
          pageSize={imports.data.pageSize}
          totalCount={imports.data.totalCount}
          onChange={setPage}
        />
      )}
      {rollBack.dialog}
    </Panel>
  )
}
