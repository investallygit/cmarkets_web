import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PROFILE_REPORT_REASONS,
  REPORT_COMMENT_MAX_LENGTH,
  useReportProfile,
} from '@/entities/profile'
import { isApiError } from '@/shared/api'
import type { ProfileReportReason } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { Textarea } from '@/shared/ui/form/Textarea'
import { toast } from '@/shared/ui/toast'

interface ReportProfileProps {
  userId: string
  displayName: string
  className?: string
}

/** "Report this profile": the report goes to the Admins, past three the account is reviewed. */
export function ReportProfile({ userId, displayName, className }: ReportProfileProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="danger" size="lg" onClick={() => setOpen(true)} className={className}>
        {t('network.view.report')}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t('network.report.title')}>
        <ReportForm userId={userId} displayName={displayName} onClose={() => setOpen(false)} />
      </Dialog>
    </>
  )
}

function ReportForm({
  userId,
  displayName,
  onClose,
}: Omit<ReportProfileProps, 'className'> & { onClose: () => void }) {
  const { t } = useTranslation()
  const report = useReportProfile(userId)
  const [reason, setReason] = useState<ProfileReportReason | ''>('')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const serverErrors = isApiError(report.error, 400) ? (report.error.problem.errors ?? {}) : {}
  const reasonError =
    (submitted && !reason && t('network.report.reasonRequired')) || serverErrors.reason?.[0]
  const commentError =
    (submitted && reason === 'other' && !comment.trim() && t('network.report.commentRequired')) ||
    (comment.length > REPORT_COMMENT_MAX_LENGTH &&
      t('network.report.commentTooLong', { max: REPORT_COMMENT_MAX_LENGTH })) ||
    serverErrors.comment?.[0]

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!reason || (reason === 'other' && !comment.trim())) return
        if (comment.length > REPORT_COMMENT_MAX_LENGTH) return
        report.mutate(
          { reason, comment: comment.trim() },
          {
            onSuccess: () => {
              toast.success(t('network.report.sent'))
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <p className="font-sans text-label text-secondary">
          {t('network.report.intro', { name: displayName })}
        </p>
        <Field label={t('network.report.reason')} error={reasonError || null}>
          <Select
            value={reason}
            options={[
              { value: '', label: t('network.report.chooseReason') },
              ...PROFILE_REPORT_REASONS.map((value) => ({
                value,
                label: t(`network.report.reasons.${value}`),
              })),
            ]}
            onChange={setReason}
          />
        </Field>
        <Field label={t('network.report.comment')} error={commentError || null}>
          <Textarea value={comment} onChange={setComment} rows={4} />
        </Field>
        {report.error && !isApiError(report.error, 400) && (
          <p role="alert" className="font-sans text-label text-down">
            {isApiError(report.error, 409) ? t('network.report.already') : report.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={report.isPending}>
          {t('network.report.send')}
        </Button>
      </DialogFooter>
    </form>
  )
}
