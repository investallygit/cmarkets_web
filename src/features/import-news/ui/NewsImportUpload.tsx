import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NEWS_LIMITS, useUploadNewsImport } from '@/entities/news'
import { Button } from '@/shared/ui/form/Button'
import { FileDrop } from '@/shared/ui/form/FileDrop'
import { toast } from '@/shared/ui/toast'

/**
 * The drop zone of screen 13's file import: a CSV, an XLSX or a ZIP of one of them with its images
 * and PDFs (spec section 16); a job checks it, the summary below follows.
 */
export function NewsImportUpload() {
  const { t } = useTranslation()
  const upload = useUploadNewsImport()
  const [file, setFile] = useState<File | null>(null)
  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(event) => {
        event.preventDefault()
        if (!file) return
        upload.mutate(file, {
          onSuccess: (sent) => {
            toast.success(t('newsStudio.import.uploaded', { file: sent.fileName }))
            setFile(null)
          },
          onError: (error) => toast.error(error.message),
        })
      }}
    >
      <FileDrop
        file={file}
        onChange={setFile}
        accept=".csv,.xlsx,.zip"
        maxSize={NEWS_LIMITS.zipBytes}
        className="[&_label]:border-info/70"
      />
      <p className="font-sans text-title text-secondary">{t('newsStudio.import.dropHint')}</p>
      {file && (
        <Button type="submit" variant="primary" disabled={upload.isPending} className="self-start">
          {t('newsStudio.import.upload')}
        </Button>
      )}
    </form>
  )
}
