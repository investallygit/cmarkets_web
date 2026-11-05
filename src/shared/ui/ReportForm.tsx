import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isApiError } from '@/shared/api'
import { DialogBody, DialogFooter } from './Dialog'
import { Button } from './form/Button'
import { Field } from './form/Field'
import { Select } from './form/Select'
import { Textarea } from './form/Textarea'

/** The comment of a report, as the report endpoints take it. */
export const REPORT_COMMENT_MAX_LENGTH = 1000

interface ReportFormProps<T extends string> {
  /** What the report leads to: who reads it, who is told. */
  intro: string
  reasons: readonly { value: T; label: string }[]
  onSubmit: (report: { reason: T; comment: string }) => void
  onClose: () => void
  pending: boolean
  error: Error | null
  /** Said when the user reported it already (409). */
  alreadyMessage: string
}

/**
 * The body of a report dialog: a reason, a comment the "other" reason requires, then Send
 * (spec sections 13 and 15). The server's errors show under their fields.
 */
export function ReportForm<T extends string>({
  intro,
  reasons,
  onSubmit,
  onClose,
  pending,
  error,
  alreadyMessage,
}: ReportFormProps<T>) {
  const { t } = useTranslation()
  const [reason, setReason] = useState<T | ''>('')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const serverErrors = isApiError(error, 400) ? (error.problem.errors ?? {}) : {}
  const reasonError =
    (submitted && !reason && t('reportForm.reasonRequired')) || serverErrors.reason?.[0]
  const commentError =
    (submitted && reason === 'other' && !comment.trim() && t('reportForm.commentRequired')) ||
    (comment.length > REPORT_COMMENT_MAX_LENGTH &&
      t('reportForm.commentTooLong', { max: REPORT_COMMENT_MAX_LENGTH })) ||
    serverErrors.comment?.[0]

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!reason || (reason === 'other' && !comment.trim())) return
        if (comment.length > REPORT_COMMENT_MAX_LENGTH) return
        onSubmit({ reason, comment: comment.trim() })
      }}
    >
      <DialogBody>
        <p className="font-sans text-label text-secondary">{intro}</p>
        <Field label={t('reportForm.reason')} error={reasonError || null}>
          <Select
            value={reason}
            options={[{ value: '' as const, label: t('reportForm.chooseReason') }, ...reasons]}
            onChange={setReason}
          />
        </Field>
        <Field label={t('reportForm.comment')} error={commentError || null}>
          <Textarea value={comment} onChange={setComment} rows={4} />
        </Field>
        {error && !isApiError(error, 400) && (
          <p role="alert" className="font-sans text-label text-down">
            {isApiError(error, 409) ? alreadyMessage : error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={pending}>
          {t('reportForm.send')}
        </Button>
      </DialogFooter>
    </form>
  )
}
