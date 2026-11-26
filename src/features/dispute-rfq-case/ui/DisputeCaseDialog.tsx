import { X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRaiseRfqDispute } from '@/entities/rfq'
import { isApiError } from '@/shared/api'
import type { RfqCompletionCaseDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { FileDrop } from '@/shared/ui/form/FileDrop'
import { Textarea } from '@/shared/ui/form/Textarea'
import { toast } from '@/shared/ui/toast'

/** CMarket.Api's RfqCompletionDispute: a PDF or an image of 5 MB, three at most, 500 characters. */
const EVIDENCE_TYPES = '.pdf,.jpg,.jpeg,.png'
const EVIDENCE_MAX_SIZE = 5 * 1024 * 1024
const MAX_FILES = 3
const REASON_MAX_LENGTH = 500

/**
 * "A participant can dispute the attribution of a failure with the Admin, giving a reason and
 * evidence" (screen 22, sixth version; ROADMAP decision 54): the trader concerned or a Manager of
 * its organisation, a reason and up to three files.
 */
export function DisputeCaseDialog({
  failure,
  onClose,
}: {
  /** The failure disputed; null closes the dialog. */
  failure: RfqCompletionCaseDto | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={failure !== null}
      onClose={onClose}
      title={t('rfqCompletion.dispute.title', {
        number: failure?.agreementNumber ?? failure?.requestNumber ?? '',
      })}
      width={480}
    >
      {failure && <DisputeForm failure={failure} onClose={onClose} />}
    </Dialog>
  )
}

/** Mounted with each opening: an empty form. */
function DisputeForm({ failure, onClose }: { failure: RfqCompletionCaseDto; onClose: () => void }) {
  const { t } = useTranslation()
  const raise = useRaiseRfqDispute()
  const [reason, setReason] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitted, setSubmitted] = useState(false)
  const serverErrors = isApiError(raise.error, 400) ? raise.error.problem.errors : undefined
  const reasonError =
    (submitted && reason.trim() === '' ? t('rfqCompletion.dispute.reasonRequired') : undefined) ??
    serverErrors?.reason?.[0]
  const filesError = serverErrors
    ? Object.entries(serverErrors).find(([key]) => key.startsWith('files'))?.[1]?.[0]
    : undefined
  const otherError = raise.error && !isApiError(raise.error, 400) ? raise.error.message : undefined

  return (
    <form
      noValidate
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (reason.trim() === '') return
        raise.mutate(
          { caseId: failure.id, input: { reason: reason.trim(), files } },
          {
            onSuccess: () => {
              toast.success(t('rfqCompletion.dispute.sent'))
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <p className="font-sans text-data text-secondary">
          {t('rfqCompletion.dispute.intro', {
            cause: t(`rfqCompletion.causes.${failure.cause}`),
          })}
        </p>
        <Field label={t('rfqCompletion.dispute.reason')} error={reasonError}>
          <Textarea value={reason} onChange={setReason} rows={4} maxLength={REASON_MAX_LENGTH} />
        </Field>
        <Field label={t('rfqCompletion.dispute.evidence', { count: MAX_FILES })} error={filesError}>
          {files.length < MAX_FILES ? (
            <FileDrop
              file={null}
              onChange={(file) => file && setFiles((current) => [...current, file])}
              accept={EVIDENCE_TYPES}
              maxSize={EVIDENCE_MAX_SIZE}
            />
          ) : (
            <p className="font-sans text-label text-secondary">
              {t('rfqCompletion.dispute.full', { count: MAX_FILES })}
            </p>
          )}
        </Field>
        {files.length > 0 && (
          <ul aria-label={t('rfqCompletion.dispute.files')} className="flex flex-col gap-1">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-2 border px-2 py-1 font-sans text-data"
              >
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  className="inline-flex size-6 items-center justify-center text-secondary hover:text-primary focus-visible:ring-1 focus-visible:ring-accent-amber focus-visible:outline-none"
                  aria-label={t('rfqCompletion.dispute.remove', { name: file.name })}
                  onClick={() => setFiles((current) => current.filter((_, at) => at !== index))}
                >
                  <X size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        {otherError && (
          <p role="alert" className="font-sans text-data text-down">
            {otherError}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" busy={raise.isPending}>
          {t('rfqCompletion.dispute.send')}
        </Button>
      </DialogFooter>
    </form>
  )
}
