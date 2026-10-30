import { Flag } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CONTENT_REPORT_REASONS, useReportPublication } from '@/entities/publication'
import { isApiError } from '@/shared/api'
import type { ContentReportReason } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { Textarea } from '@/shared/ui/form/Textarea'
import { toast } from '@/shared/ui/toast'

const MAX_COMMENT_LENGTH = 1000

/** "Report content": the report goes to the Admins' moderation queue (spec section 13). */
export function ReportPublication({ publicationId }: { publicationId: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="link" size="sm" icon={Flag} onClick={() => setOpen(true)}>
        {t('contentReport.action')}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t('contentReport.title')}>
        <ReportForm publicationId={publicationId} onClose={() => setOpen(false)} />
      </Dialog>
    </>
  )
}

function ReportForm({ publicationId, onClose }: { publicationId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const report = useReportPublication(publicationId)
  const [reason, setReason] = useState<ContentReportReason | ''>('')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const serverErrors = isApiError(report.error, 400) ? (report.error.problem.errors ?? {}) : {}
  const reasonError =
    (submitted && !reason && t('contentReport.reasonRequired')) || serverErrors.reason?.[0]
  const commentError =
    (submitted && reason === 'other' && !comment.trim() && t('contentReport.commentRequired')) ||
    (comment.length > MAX_COMMENT_LENGTH &&
      t('contentReport.commentTooLong', { max: MAX_COMMENT_LENGTH })) ||
    serverErrors.comment?.[0]

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!reason || (reason === 'other' && !comment.trim())) return
        if (comment.length > MAX_COMMENT_LENGTH) return
        report.mutate(
          { reason, comment: comment.trim() },
          {
            onSuccess: () => {
              toast.success(t('contentReport.sent'))
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <p className="font-sans text-label text-secondary">{t('contentReport.intro')}</p>
        <Field label={t('contentReport.reason')} error={reasonError || null}>
          <Select
            value={reason}
            options={[
              { value: '', label: t('contentReport.chooseReason') },
              ...CONTENT_REPORT_REASONS.map((value) => ({
                value,
                label: t(`contentReport.reasons.${value}`),
              })),
            ]}
            onChange={setReason}
          />
        </Field>
        <Field label={t('contentReport.comment')} error={commentError || null}>
          <Textarea value={comment} onChange={setComment} rows={4} />
        </Field>
        {report.error && !isApiError(report.error, 400) && (
          <p role="alert" className="font-sans text-label text-down">
            {report.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={report.isPending}>
          {t('contentReport.send')}
        </Button>
      </DialogFooter>
    </form>
  )
}
