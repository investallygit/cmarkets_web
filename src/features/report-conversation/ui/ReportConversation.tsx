import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CONVERSATION_REPORT_REASONS, useReportConversation } from '@/entities/conversation'
import { Dialog } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { ReportForm } from '@/shared/ui/ReportForm'
import { toast } from '@/shared/ui/toast'

/** "Report conversation": the Admin may then read it, and that reading is logged. */
export function ReportConversation({
  conversationId,
  className,
}: {
  conversationId: string
  className?: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const report = useReportConversation(conversationId)
  const close = () => {
    setOpen(false)
    report.reset()
  }
  return (
    <>
      <Button variant="danger" size="lg" onClick={() => setOpen(true)} className={className}>
        {t('messaging.participant.report')}
      </Button>
      <Dialog open={open} onClose={close} title={t('messaging.report.title')}>
        <ReportForm
          intro={t('messaging.report.intro')}
          reasons={CONVERSATION_REPORT_REASONS.map((value) => ({
            value,
            label: t(`messaging.report.reasons.${value}`),
          }))}
          onSubmit={(input) =>
            report.mutate(input, {
              onSuccess: () => {
                toast.success(t('messaging.report.sent'))
                close()
              },
            })
          }
          onClose={close}
          pending={report.isPending}
          error={report.error}
          alreadyMessage={t('messaging.report.already')}
        />
      </Dialog>
    </>
  )
}
