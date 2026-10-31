import { LoaderCircle, Plus, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  isChangeField,
  isChecking,
  useImport,
  useImportRows,
  useImportTypes,
  type ChangeField,
} from '@/entities/data-import'
import { AlertCheckedBox, ImportActions } from '@/features/review-import'
import { useRollBack } from '@/features/roll-back-import'
import { UploadForm } from '@/features/upload-data-file'
import type { ImportDto, ImportRowDto, ImportRowStatus } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelLoading } from '@/shared/ui/StatusViews'
import { ImportCounters } from './ImportCounters'
import { ImportRowsTable } from './ImportRowsTable'
import { ImportSteps } from './ImportSteps'

interface CurrentUploadPanelProps {
  /** The upload shown; null for the upload form. */
  importId: string | null
  /** The current session, the form's default. */
  sessionDate: string | null
  /** Opens an upload, or the form (null). */
  onOpen: (importId: string | null) => void
}

/**
 * Screen 6, current upload (POST /data/imports, GET /data/imports/{id}/rows, POST .../publish):
 * the five steps, the counters, the rows with their check, then Publish, Fix row, Replace file
 * and Discard. Publish stays disabled while an error remains or an alert is not ticked "checked".
 */
export function CurrentUploadPanel({ importId, sessionDate, onOpen }: CurrentUploadPanelProps) {
  const { t } = useTranslation()
  const upload = useImport(importId)
  const typeName = upload.data && t(`dataImport.types.${upload.data.type}`)

  return (
    <Panel
      title={
        upload.data
          ? t('panels.currentUploadOf', { file: upload.data.fileName })
          : t('panels.newUpload')
      }
      code="IMP"
      options={typeName && <span>{t('dataImport.typeLabel', { type: typeName })}</span>}
      bodyClassName="flex flex-col"
    >
      {importId === null ? (
        <>
          <ImportSteps status={null} />
          <UploadForm
            sessionDate={sessionDate}
            onUploaded={(created) => onOpen(created.id)}
            onOpenPending={onOpen}
          />
        </>
      ) : (
        <QueryView query={upload}>
          {(data) => <UploadView key={data.id} upload={data} onOpen={onOpen} />}
        </QueryView>
      )}
    </Panel>
  )
}

/** The figure an alert is about: a change, or the volume of a quiet session. */
function alertField(row: ImportRowDto): ChangeField | 'volume' {
  const column = row.issues.find((issue) => issue.severity === 'alert')?.column ?? ''
  return isChangeField(column) ? column : 'volume'
}

function UploadView({
  upload,
  onOpen,
}: {
  upload: ImportDto
  onOpen: (importId: string | null) => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const types = useImportTypes()
  const [filter, setFilter] = useState<ImportRowStatus | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const rollBack = useRollBack()
  const checking = isChecking(upload.status)
  const rows = useImportRows(upload.id, filter, 1, !checking)
  const editable = upload.status === 'ready' || upload.status === 'rolledBack'

  const definition = types.data?.find((candidate) => candidate.type === upload.type)
  const columns = definition?.columns.filter((column) => upload.columns.includes(column.name)) ?? []
  const items = rows.data?.items ?? []
  // The first row to look at is selected until the Data admin picks another.
  const selected: ImportRowDto | null =
    items.find((row) => row.id === selectedId) ??
    items.find((row) => row.status === 'error' || (row.status === 'alert' && !row.checked)) ??
    null
  const when = (iso: string) => `${format.dayMonth(iso)} ${format.time(iso)}`

  return (
    <>
      <ImportSteps status={upload.status} />
      <p className="px-3 pb-1 font-sans text-data text-secondary">
        {t('dataImport.uploadedBy', {
          when: when(upload.uploadedAt),
          name: upload.uploadedBy,
          session: format.isoDate(upload.sessionDate),
        })}
      </p>
      {checking ? (
        <p className="flex items-center gap-2 px-3 py-2 font-sans text-label text-warning">
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
          {t('dataImport.checking', { count: upload.counts.read })}
        </p>
      ) : (
        <ImportCounters counts={upload.counts} filter={filter} onFilter={setFilter} />
      )}
      {upload.rollback && upload.status !== 'published' && (
        <p className="mx-3 mb-2 border border-down/50 bg-down/10 px-2 py-1 font-sans text-data text-primary">
          {t('dataImport.rolledBackBy', {
            when: when(upload.rollback.at),
            name: upload.rollback.by,
            reason: upload.rollback.reason,
          })}{' '}
          <span className="text-secondary">{t('dataImport.rolledBackHint')}</span>
        </p>
      )}
      <div className="min-h-24 flex-1 border-y">
        {checking || !definition ? (
          <PanelLoading />
        ) : (
          <QueryView query={rows}>
            {(page) => (
              <ImportRowsTable
                rows={page.items}
                columns={columns}
                selectedId={selected?.id ?? null}
                onSelect={(row) => setSelectedId(row.id)}
                exportName={upload.fileName.replace(/\.\w+$/, '')}
                emptyMessage={t('dataImport.noRows')}
              />
            )}
          </QueryView>
        )}
      </div>
      <div className="grid shrink-0 gap-2 px-3 py-2">
        {selected && editable && (
          <>
            <p className="font-sans text-data text-secondary">
              {selected.status === 'alert'
                ? t('dataImport.selected.alert', {
                    row: selected.line - 1,
                    field: t(`dataImport.checkFields.${alertField(selected)}`),
                    source: t(`dataImport.sources.${upload.type}`),
                  })
                : selected.status === 'error'
                  ? t('dataImport.selected.error', { row: selected.line - 1 })
                  : t('dataImport.selected.ok', { row: selected.line - 1 })}
            </p>
            <AlertCheckedBox upload={upload} row={selected} editable={editable} />
          </>
        )}
        {upload.status === 'published' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto font-sans text-label text-up">
              {t('dataImport.publishedBy', {
                when: when(upload.publishedAt ?? upload.uploadedAt),
                name: upload.publishedBy ?? '',
                count: upload.counts.read,
              })}
            </span>
            <Button variant="danger" icon={Undo2} onClick={() => rollBack.ask(upload)}>
              {t('dataImport.rollBack')}
            </Button>
            <Button icon={Plus} onClick={() => onOpen(null)}>
              {t('dataImport.upload.newUpload')}
            </Button>
          </div>
        )}
        {upload.status === 'discarded' && (
          <div className="flex items-center gap-2">
            <span className="mr-auto font-sans text-label text-secondary">
              {t('dataImport.discardedNote')}
            </span>
            <Button icon={Plus} onClick={() => onOpen(null)}>
              {t('dataImport.upload.newUpload')}
            </Button>
          </div>
        )}
        {(editable || checking) && (
          <ImportActions
            upload={upload}
            row={selected}
            columns={columns}
            editable={editable}
            onReplaced={(created) => onOpen(created.id)}
          />
        )}
        <p className="font-sans text-caption text-secondary">
          {t(`dataImport.onPublish.${upload.type}`)}
        </p>
      </div>
      {rollBack.dialog}
    </>
  )
}
