import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NEWS_LIMITS, useUploadNewsFile } from '@/entities/news'
import type { NewsStudioFileDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { FileDrop } from '@/shared/ui/form/FileDrop'
import { TextInput } from '@/shared/ui/form/TextInput'

interface ImageDialogProps {
  open: boolean
  onClose: () => void
  newsId: string
  onInsert: (image: NewsStudioFileDto) => void
}

/** "Image" of the toolbar: a JPEG or PNG of 2 MB at most and its credit, uploaded, then inserted. */
export function ImageDialog({ open, onClose, newsId, onInsert }: ImageDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('newsStudio.image.title')}>
      <ImageForm newsId={newsId} onClose={onClose} onInsert={onInsert} />
    </Dialog>
  )
}

function ImageForm({ newsId, onClose, onInsert }: Omit<ImageDialogProps, 'open'>) {
  const { t } = useTranslation()
  const upload = useUploadNewsFile(newsId)
  const [file, setFile] = useState<File | null>(null)
  const [credit, setCredit] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const creditMissing = !credit.trim()
  const serverError = upload.error?.message
  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!file || creditMissing) return
        upload.mutate(
          { file, credit: credit.trim() },
          {
            onSuccess: (image) => {
              onInsert(image)
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody className="grid gap-3">
        <Field
          label={t('newsStudio.image.file')}
          error={submitted && !file ? t('newsStudio.image.fileRequired') : null}
        >
          <FileDrop
            file={file}
            onChange={setFile}
            accept=".jpg,.jpeg,.png"
            maxSize={NEWS_LIMITS.imageBytes}
          />
        </Field>
        <Field
          label={t('newsStudio.image.credit')}
          hint={t('newsStudio.image.creditHint')}
          error={submitted && creditMissing ? t('newsStudio.image.creditRequired') : null}
        >
          <TextInput value={credit} onChange={setCredit} maxLength={NEWS_LIMITS.imageCredit} />
        </Field>
        {serverError && (
          <p role="alert" className="font-sans text-data text-down">
            {serverError}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" disabled={upload.isPending}>
          {t('newsStudio.image.insert')}
        </Button>
      </DialogFooter>
    </form>
  )
}
