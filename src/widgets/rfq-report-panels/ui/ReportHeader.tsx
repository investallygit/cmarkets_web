import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDailyReportSettings } from '@/entities/rfq-report'
import { useFormat } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'

/**
 * Screen 24's header (API /admin/rfq/daily-report-settings): "Automatic send every business day at
 * 18:00 · to: BEAC (configured address) · copy: CMarket compliance · PDF summary + Excel of trades",
 * and the next send; the RFQ off, nothing is sent.
 */
export function ReportHeader() {
  const { t } = useTranslation()
  const format = useFormat()
  const settings = useDailyReportSettings()
  // Today in the user's time zone, when the screen opens: the next send is today's or another day's.
  const [today] = useState(() => format.day(Date.now()))
  if (!settings.data) return null
  const { sendTime, beacAddress, copies, nextSendAt } = settings.data
  const parts = [
    t('rfqReports.header.automatic', { time: sendTime }),
    beacAddress
      ? t('rfqReports.header.to', { address: beacAddress })
      : t('rfqReports.header.noAddress'),
    copies.length > 0
      ? t('rfqReports.header.copies', { addresses: copies.join(', ') })
      : t('rfqReports.header.noCopies'),
    t('rfqReports.header.files'),
  ]
  return (
    <section
      aria-label={t('rfqReports.header.label')}
      className="flex flex-wrap items-center justify-between gap-2 border bg-panel px-3 py-2"
    >
      <p className="font-sans text-data text-primary">{parts.join(' · ')}</p>
      {nextSendAt ? (
        <Badge tone="info">
          {format.day(nextSendAt) === today
            ? t('rfqReports.header.next', { time: format.time(nextSendAt) })
            : t('rfqReports.header.nextDay', {
                day: format.dayMonth(nextSendAt),
                time: format.time(nextSendAt),
              })}
        </Badge>
      ) : (
        <Badge tone="neutral">{t('rfqReports.header.off')}</Badge>
      )}
    </section>
  )
}
