import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PROFILE_REPORT_REASONS, useReportProfile } from '@/entities/profile'
import { Dialog } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { ReportForm } from '@/shared/ui/ReportForm'
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
  const report = useReportProfile(userId)
  const close = () => {
    setOpen(false)
    report.reset()
  }
  return (
    <>
      <Button variant="danger" size="lg" onClick={() => setOpen(true)} className={className}>
        {t('network.view.report')}
      </Button>
      <Dialog open={open} onClose={close} title={t('network.report.title')}>
        <ReportForm
          intro={t('network.report.intro', { name: displayName })}
          reasons={PROFILE_REPORT_REASONS.map((value) => ({
            value,
            label: t(`network.report.reasons.${value}`),
          }))}
          onSubmit={(input) =>
            report.mutate(input, {
              onSuccess: () => {
                toast.success(t('network.report.sent'))
                close()
              },
            })
          }
          onClose={close}
          pending={report.isPending}
          error={report.error}
          alreadyMessage={t('network.report.already')}
        />
      </Dialog>
    </>
  )
}
