import { Upload } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  IMPORT_TYPES,
  MAX_UPLOAD_BYTES,
  TemplateLinks,
  UPLOAD_ACCEPT,
  useUploadImport,
} from '@/entities/data-import'
import { isApiError } from '@/shared/api'
import type { ImportDto, ImportType } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { FileDrop } from '@/shared/ui/form/FileDrop'
import { Select } from '@/shared/ui/form/Select'

interface UploadFormProps {
  /** The current session, given by the coverage. */
  sessionDate: string | null
  onUploaded: (upload: ImportDto) => void
  /** A file being checked for the same session and type, to open instead. */
  onOpenPending?: (importId: string) => void
}

/** Step 1 of spec section 11: the file type, its session and the file, by drag and drop or picker. */
export function UploadForm({ sessionDate, onUploaded, onOpenPending }: UploadFormProps) {
  const { t } = useTranslation()
  const upload = useUploadImport()
  const [type, setType] = useState<ImportType>('daily-prices')
  const [session, setSession] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const date = session ?? sessionDate

  const errors = isApiError(upload.error, 400) ? (upload.error.problem.errors ?? {}) : {}
  const pendingId =
    isApiError(upload.error, 409) && typeof upload.error.problem.importId === 'string'
      ? upload.error.problem.importId
      : null
  const otherError =
    upload.error && !isApiError(upload.error, 400) ? upload.error.message : undefined

  return (
    <form
      noValidate
      className="grid gap-3 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!file || !date) return
        upload.mutate({ type, sessionDate: date, file }, { onSuccess: onUploaded })
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_9rem] gap-3">
        <Field
          label={t('dataImport.upload.fileType')}
          error={errors.type?.[0]}
          hint={
            <span className="inline-flex items-center gap-1.5">
              {t('dataImport.upload.template')} <TemplateLinks type={type} />
            </span>
          }
        >
          <Select
            value={type}
            options={IMPORT_TYPES.map((value) => ({
              value,
              label: t(`dataImport.types.${value}`),
            }))}
            onChange={(value) => {
              upload.reset()
              setType(value)
            }}
          />
        </Field>
        <Field label={t('dataImport.upload.sessionDate')} error={errors.sessionDate?.[0]}>
          <DateInput
            value={date}
            onChange={(value) => {
              upload.reset()
              setSession(value)
            }}
            highlight
          />
        </Field>
      </div>
      <Field label={t('dataImport.upload.file')} error={errors.file?.[0]}>
        <FileDrop
          file={file}
          onChange={(next) => {
            upload.reset()
            setFile(next)
          }}
          accept={UPLOAD_ACCEPT}
          maxSize={MAX_UPLOAD_BYTES}
        />
      </Field>
      {otherError && (
        <p role="alert" className="font-sans text-data text-down">
          {otherError}{' '}
          {pendingId && onOpenPending && (
            <button
              type="button"
              className="text-info hover:underline"
              onClick={() => onOpenPending(pendingId)}
            >
              {t('dataImport.upload.openPending')}
            </button>
          )}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          icon={Upload}
          busy={upload.isPending}
          disabled={!file || !date}
        >
          {t('dataImport.upload.submit')}
        </Button>
        <span className="font-sans text-data text-secondary">{t('dataImport.upload.intro')}</span>
      </div>
    </form>
  )
}
