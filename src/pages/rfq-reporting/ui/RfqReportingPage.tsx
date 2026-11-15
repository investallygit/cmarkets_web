import { useState } from 'react'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { useFormat } from '@/shared/i18n'
import { RfqTabs } from '@/widgets/rfq-tabs'
import {
  DailyReportsPanel,
  ReportHeader,
  SendPanel,
  SummaryPreviewPanel,
} from '@/widgets/rfq-report-panels'
import { RFQ_REPORT_LAYOUT } from '../config/layout'

/**
 * Screen 24, RFQ REP (spec section 9; ROADMAP step 47): the daily reporting to the BEAC, the
 * compliance team's, i.e. the Admin's (decision 17): the automatic send's header, the month's
 * reports by business day, the PDF summary of the day picked as it will be or was sent, its send
 * (Send now or Resend, the files, the log) and the settings. The page holds the month and the day.
 */
export function RfqReportingPage() {
  const format = useFormat()
  const [month, setMonth] = useState(() => format.day(Date.now()).slice(0, 7))
  const [date, setDate] = useState<string | null>(null)

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-2 px-2 pt-2">
        <RfqTabs />
        <ReportHeader />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace
          screenId="RFQREP"
          defaultLayout={RFQ_REPORT_LAYOUT}
          panels={{
            reports: (
              <DailyReportsPanel
                month={month}
                onMonth={(next) => {
                  setMonth(next)
                  setDate(null)
                }}
                selected={date}
                onSelect={setDate}
              />
            ),
            preview: <SummaryPreviewPanel date={date} />,
            send: <SendPanel date={date} />,
          }}
        />
      </div>
    </div>
  )
}
