import { Flag } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NEWS_REPORT_REASONS, useReportNews } from '@/entities/news'
import { Dialog } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { ReportForm } from '@/shared/ui/ReportForm'
import { toast } from '@/shared/ui/toast'

/**
 * "Report" under an item of N (ROADMAP step 27): the report goes to the moderators of NEWS and MOD,
 * the newspaper never learns who sent it. Reported again while open, the latest words count.
 */
export function ReportNews({ newsId }: { newsId: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const report = useReportNews(newsId)
  const close = () => {
    setOpen(false)
    report.reset()
  }
  return (
    <>
      <Button variant="link" size="sm" icon={Flag} onClick={() => setOpen(true)}>
        {t('newsReport.action')}
      </Button>
      <Dialog open={open} onClose={close} title={t('newsReport.title')}>
        <ReportForm
          intro={t('newsReport.intro')}
          reasons={NEWS_REPORT_REASONS.map((value) => ({
            value,
            label: t(`contentReport.reasons.${value}`),
          }))}
          onSubmit={(input) =>
            report.mutate(input, {
              onSuccess: () => {
                toast.success(t('newsReport.sent'))
                close()
              },
            })
          }
          onClose={close}
          pending={report.isPending}
          error={report.error}
          alreadyMessage={t('newsReport.already')}
        />
      </Dialog>
    </>
  )
}
