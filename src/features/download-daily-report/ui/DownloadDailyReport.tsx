import { FileSpreadsheet, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { compactDate, useDownloadDailyReport } from '@/entities/rfq-report'
import { saveBlob } from '@/shared/lib/download'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

/**
 * Screen 24's "Download PDF" and "Download Excel": the day's files as sent, or as they would be
 * before it is made; a nil report has no Excel file.
 */
export function DownloadDailyReport({ date, hasList }: { date: string; hasList: boolean }) {
  const { t } = useTranslation()
  const download = useDownloadDailyReport()
  const save = (kind: 'summary' | 'transactions') =>
    download.mutate(
      { date, kind },
      {
        onSuccess: (blob) =>
          saveBlob(
            blob,
            kind === 'summary'
              ? `CMarket_BEAC_synthese_${compactDate(date)}.pdf`
              : `CMarket_BEAC_transactions_${compactDate(date)}.xlsx`,
          ),
        onError: (error) => toast.error(error.message),
      },
    )
  const busy = (kind: 'summary' | 'transactions') =>
    download.isPending && download.variables?.kind === kind

  return (
    <div className="flex flex-col gap-2">
      <Button variant="info" icon={FileText} busy={busy('summary')} onClick={() => save('summary')}>
        {t('rfqReports.send.downloadPdf')}
      </Button>
      <Button
        variant="info"
        icon={FileSpreadsheet}
        busy={busy('transactions')}
        disabled={!hasList}
        onClick={() => save('transactions')}
      >
        {t('rfqReports.send.downloadExcel')}
      </Button>
    </div>
  )
}
