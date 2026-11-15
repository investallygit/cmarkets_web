import { Send } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isMade, useSendDailyReport } from '@/entities/rfq-report'
import type { DailyReportDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

/**
 * Screen 24's "Send now (or Resend)": a day not made yet is made up to now and e-mailed to the
 * BEAC and the copies; a day made goes again, its files as sent. Confirmed first: it leaves the
 * platform. A send that fails says so; the Admins are told by the API.
 */
export function SendDailyReportButton({ report }: { report: DailyReportDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const send = useSendDailyReport()
  const [open, setOpen] = useState(false)
  const day = format.isoDate(report.date)
  const made = isMade(report.status)

  if (report.status === 'skipped')
    return <p className="font-sans text-data text-secondary">{t('rfqReports.send.skipped')}</p>
  return (
    <>
      <Button
        variant="primary"
        size="lg"
        icon={Send}
        className="w-full"
        onClick={() => setOpen(true)}
      >
        {made ? t('rfqReports.send.resend') : t('rfqReports.send.sendNow')}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t(made ? 'rfqReports.send.confirmResendTitle' : 'rfqReports.send.confirmNowTitle', {
          day,
        })}
        message={t(made ? 'rfqReports.send.confirmResend' : 'rfqReports.send.confirmNow')}
        confirmLabel={made ? t('rfqReports.send.resend') : t('rfqReports.send.sendNow')}
        busy={send.isPending}
        onConfirm={() =>
          send.mutate(report.date, {
            onSuccess: (after) => {
              setOpen(false)
              if (after.status === 'failed')
                toast.error(t('rfqReports.send.failed', { error: after.sends[0]?.error ?? '' }))
              else toast.success(t('rfqReports.send.sent', { day }))
            },
            onError: (error) => {
              setOpen(false)
              toast.error(error.message)
            },
          })
        }
      />
    </>
  )
}
