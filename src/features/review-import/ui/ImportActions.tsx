import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_ACCEPT,
  useDiscardImport,
  usePublishImport,
  useUploadImport,
} from '@/entities/data-import'
import type { ImportColumnDto, ImportDto, ImportRowDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { FixRowDialog } from './FixRowDialog'

interface ImportActionsProps {
  upload: ImportDto
  /** The row the Data admin selected, for Fix row. */
  row: ImportRowDto | null
  columns: readonly ImportColumnDto[]
  /** The rows can still change: the preview, or a rolled back file. */
  editable: boolean
  /** Replace file started a new upload in place of this one. */
  onReplaced: (upload: ImportDto) => void
}

/**
 * Publish, Fix row, Replace file, Discard (screen 6). Publish stays disabled while an error
 * remains or an alert is not ticked "checked".
 */
export function ImportActions({ upload, row, columns, editable, onReplaced }: ImportActionsProps) {
  const { t } = useTranslation()
  const publish = usePublishImport()
  const discard = useDiscardImport()
  const replace = useUploadImport()
  const fileInput = useRef<HTMLInputElement>(null)
  const [fixing, setFixing] = useState<ImportRowDto | null>(null)
  const [discarding, setDiscarding] = useState(false)
  const { counts } = upload
  const ready = editable && counts.errors === 0 && counts.alertsChecked === counts.alerts
  const error = publish.error ?? replace.error ?? discard.error

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          size="lg"
          disabled={!ready || counts.read === 0}
          busy={publish.isPending}
          onClick={() => publish.mutate(upload.id)}
        >
          {t('dataImport.publishRows', { count: counts.read })}
        </Button>
        <Button size="lg" disabled={!editable || !row} onClick={() => setFixing(row)}>
          {t('dataImport.fixRow')}
        </Button>
        <Button
          size="lg"
          icon={Upload}
          disabled={!editable}
          busy={replace.isPending}
          onClick={() => fileInput.current?.click()}
        >
          {t('dataImport.replaceFile')}
        </Button>
        <Button variant="danger" size="lg" disabled={!editable} onClick={() => setDiscarding(true)}>
          {t('dataImport.discard')}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept={UPLOAD_ACCEPT}
          className="hidden"
          aria-label={t('dataImport.replaceFile')}
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            if (file.size > MAX_UPLOAD_BYTES) return replace.reset()
            replace.mutate(
              { type: upload.type, sessionDate: upload.sessionDate, file, replacesId: upload.id },
              { onSuccess: onReplaced },
            )
          }}
        />
      </div>
      {editable && !ready && (
        <p className="font-sans text-data text-secondary">{t('dataImport.publishBlocked')}</p>
      )}
      {error && (
        <p role="alert" className="font-sans text-data text-down">
          {error.message}
        </p>
      )}
      <FixRowDialog
        upload={upload}
        row={fixing}
        columns={columns}
        onClose={() => setFixing(null)}
      />
      <ConfirmDialog
        open={discarding}
        onClose={() => setDiscarding(false)}
        title={t('dataImport.discardTitle')}
        message={t('dataImport.discardMessage', { file: upload.fileName })}
        confirmLabel={t('dataImport.discard')}
        tone="danger"
        busy={discard.isPending}
        onConfirm={() => discard.mutate(upload.id, { onSuccess: () => setDiscarding(false) })}
      />
    </div>
  )
}
