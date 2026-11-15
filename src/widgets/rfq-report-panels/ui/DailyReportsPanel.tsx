import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { millions, REPORT_STATUS_TONES, shiftMonth, useDailyReports } from '@/entities/rfq-report'
import type { DailyReportDayDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { TONE_TEXT } from '../lib/tones'

interface DailyReportsPanelProps {
  /** yyyy-MM */
  month: string
  onMonth: (month: string) => void
  selected: string | null
  onSelect: (date: string) => void
}

/**
 * Screen 24's "Daily reports" (API /rfq/daily-reports): one report per business day, newest first,
 * its agreements, its face amount and its send status (Scheduled, Sent, Nil report sent, Failed,
 * Resent); the day picked shows in the preview and the send panel, the newest by default.
 */
export function DailyReportsPanel({ month, onMonth, selected, onSelect }: DailyReportsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const reports = useDailyReports(month)
  const newest = reports.data?.days[0]?.date

  // The newest day once the list comes, when none is picked yet.
  useEffect(() => {
    if (selected === null && newest) onSelect(newest)
  }, [selected, newest, onSelect])

  return (
    <Panel
      title={t('panels.rfqReports')}
      code="RFQ REP"
      options={
        <span className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            icon={ChevronLeft}
            aria-label={t('rfqReports.list.previous')}
            onClick={() => onMonth(shiftMonth(month, -1))}
          />
          <span className="font-mono text-label text-secondary uppercase">
            {format.month(month)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            icon={ChevronRight}
            aria-label={t('rfqReports.list.next')}
            onClick={() => onMonth(shiftMonth(month, 1))}
          />
        </span>
      }
    >
      <QueryView
        query={reports}
        isEmpty={(data) => data.days.length === 0}
        emptyMessage={t('rfqReports.list.empty')}
      >
        {(data) => (
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full font-mono text-data tabular-nums">
              <caption className="sr-only">
                {t('rfqReports.list.caption', { month: format.month(month) })}
              </caption>
              <thead className="sticky top-0 bg-panel-header font-sans text-label text-secondary">
                <tr>
                  <th scope="col" className="px-2 py-1 text-left font-normal">
                    {t('rfqReports.list.day')}
                  </th>
                  <th scope="col" className="px-2 py-1 text-right font-normal">
                    {t('rfqReports.list.agreements')}
                  </th>
                  <th scope="col" className="px-2 py-1 text-right font-normal">
                    {t('rfqReports.list.face')}
                  </th>
                  <th scope="col" className="px-2 py-1 text-left font-normal">
                    {t('rfqReports.list.sent')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.days.map((day) => (
                  <DayRow
                    key={day.date}
                    day={day}
                    selected={day.date === selected}
                    onSelect={() => onSelect(day.date)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </QueryView>
    </Panel>
  )
}

function DayRow({
  day,
  selected,
  onSelect,
}: {
  day: DailyReportDayDto
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const status = t(`rfqReports.status.${day.status}`)
  return (
    <tr
      className={`cursor-pointer border-b ${selected ? 'bg-selected' : 'hover:bg-row-alt'}`}
      onClick={onSelect}
    >
      <td className="px-2 py-1">
        <button
          type="button"
          aria-pressed={selected}
          className="min-h-6 text-left text-primary focus-visible:outline"
          onClick={(event) => {
            event.stopPropagation()
            onSelect()
          }}
        >
          {format.weekday(day.date, 'short')} {format.isoDate(day.date).slice(0, 5)}
        </button>
      </td>
      <td className="px-2 py-1 text-right text-primary">{day.agreementCount}</td>
      <td className="px-2 py-1 text-right text-primary">
        {day.agreementCount > 0 ? millions(day.faceAmount, format.number) : '–'}
      </td>
      <td className={`px-2 py-1 font-sans ${TONE_TEXT[REPORT_STATUS_TONES[day.status]]}`}>
        {day.sentAt && day.status !== 'skipped' ? `${status} ${format.time(day.sentAt)}` : status}
      </td>
    </tr>
  )
}
