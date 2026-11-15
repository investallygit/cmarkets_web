import { Settings } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  REPORT_STATUS_TONES,
  shortSha,
  useDailyReport,
  useDailyReportSettings,
} from '@/entities/rfq-report'
import { DownloadDailyReport } from '@/features/download-daily-report'
import { DailyReportSettingsDialog } from '@/features/edit-daily-report-settings'
import { SendDailyReportButton } from '@/features/send-daily-report'
import type { DailyReportDto, DailyReportSettingsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { TONE_TEXT } from '../lib/tones'

/**
 * Screen 24's send panel (API /send, /transactions.xlsx): the day's status, recipients, subject,
 * attachments with their fingerprints and the Excel's columns; Send now (or Resend), Download PDF,
 * Download Excel; every send logged; the settings (Admin).
 */
export function SendPanel({ date }: { date: string | null }) {
  const { t } = useTranslation()
  const format = useFormat()
  const report = useDailyReport(date)
  const settings = useDailyReportSettings()
  return (
    <Panel
      title={
        date ? t('rfqReports.send.title', { day: format.isoDate(date) }) : t('panels.rfqReportSend')
      }
      code="RFQ REP"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-2 font-sans text-data">
        {date !== null && (
          <QueryView query={report}>
            {(data) => <SendDetails report={data} sendTime={settings.data?.sendTime} />}
          </QueryView>
        )}
        {settings.data && <SettingsSummary settings={settings.data} />}
      </div>
    </Panel>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <dt className="shrink-0 text-secondary">{label}</dt>
      <dd className="min-w-0 text-right break-words text-primary">{children}</dd>
    </div>
  )
}

function Heading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="text-title font-semibold tracking-title text-accent-amber uppercase">
      {children}
    </h3>
  )
}

function SendDetails({
  report,
  sendTime,
}: {
  report: DailyReportDto
  sendTime: string | undefined
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const latest = report.sends[0]
  const status = t(`rfqReports.status.${report.status}`)
  const hasList =
    report.files.some((file) => file.kind === 'transactions') ||
    (report.preview &&
      report.figures.agreementCount + report.figures.cancellations.agreementCount > 0)

  return (
    <>
      <dl className="flex flex-col">
        <Row label={t('rfqReports.send.status')}>
          <span className={TONE_TEXT[REPORT_STATUS_TONES[report.status]]}>
            {report.status === 'scheduled'
              ? t('rfqReports.send.scheduledAt', { time: sendTime ?? '' })
              : latest
                ? t('rfqReports.send.statusAt', {
                    status,
                    time: `${format.date(latest.at)} ${format.time(latest.at)}`,
                  })
                : status}
          </span>
        </Row>
        <Row label={t('rfqReports.send.to')}>
          {report.recipients.to || t('rfqReports.send.none')}
        </Row>
        <Row label={t('rfqReports.send.copy')}>
          {report.recipients.copies.length > 0
            ? report.recipients.copies.join(', ')
            : t('rfqReports.send.none')}
        </Row>
        <Row label={t('rfqReports.send.subject')}>
          <span className="font-mono">{report.subject}</span>
        </Row>
      </dl>

      <section aria-labelledby="rfq-report-attachments" className="flex flex-col gap-1.5">
        <Heading id="rfq-report-attachments">{t('rfqReports.send.attachments')}</Heading>
        {report.files.length === 0 ? (
          <p className="text-secondary">{t('rfqReports.send.notMadeFiles')}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {report.files.map((file) => (
              <li
                key={file.kind}
                className="flex flex-col gap-0.5 border bg-panel-header px-2 py-1.5"
              >
                <span className="font-mono break-all text-info">{file.fileName}</span>
                <span className="text-secondary">
                  {file.kind === 'summary'
                    ? t('rfqReports.send.summaryFile', { count: file.pages ?? 1 })
                    : t('rfqReports.send.listFile', {
                        rows: file.rows ?? 0,
                        columns: file.columns ?? 0,
                      })}
                  {' · '}
                  {format.fileSize(file.size)} · SHA-256{' '}
                  <span title={file.sha256}>{shortSha(file.sha256)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="rfq-report-columns" className="flex flex-col gap-1">
        <Heading id="rfq-report-columns">{t('rfqReports.send.columns')}</Heading>
        <p className="text-secondary">{report.columns.join(' · ')}</p>
      </section>

      <div className="flex flex-col gap-2">
        <SendDailyReportButton report={report} />
        <DownloadDailyReport date={report.date} hasList={hasList} />
      </div>

      {report.sends.length > 0 && (
        <section aria-labelledby="rfq-report-sends" className="flex flex-col gap-1">
          <Heading id="rfq-report-sends">{t('rfqReports.send.log')}</Heading>
          <ul className="flex flex-col">
            {report.sends.map((send) => (
              <li key={send.at} className="flex flex-col gap-0.5 border-b py-1 last:border-b-0">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-secondary tabular-nums">
                    {format.date(send.at)} {format.time(send.at, true)}
                  </span>
                  <span className={send.status === 'sent' ? 'text-up' : 'text-down'}>
                    {t(`rfqReports.status.${send.status}`)}
                  </span>
                </span>
                <span className="text-primary">{send.by ?? t('rfqReports.send.byJob')}</span>
                {send.error && <span className="break-words text-down">{send.error}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function SettingsSummary({ settings }: { settings: DailyReportSettingsDto }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  return (
    <section aria-labelledby="rfq-report-settings" className="flex flex-col gap-1">
      <Heading id="rfq-report-settings">{t('rfqReports.settings.title')}</Heading>
      <dl className="flex flex-col">
        <Row label={t('rfqReports.settings.sendTime')}>
          {t('rfqReports.settings.sendTimeValue', { time: settings.sendTime })}
        </Row>
        <Row label={t('rfqReports.settings.nilReport')}>
          {settings.nilReport ? t('rfqReports.settings.yes') : t('rfqReports.settings.no')}
        </Row>
        <Row label={t('rfqReports.settings.recipients')}>
          {settings.copies.length > 0
            ? t('rfqReports.settings.recipientsValue', { count: settings.copies.length })
            : t('rfqReports.settings.recipientsNoCopy')}
        </Row>
      </dl>
      <div>
        <Button variant="secondary" icon={Settings} onClick={() => setEditing(true)}>
          {t('rfqReports.settings.edit')}
        </Button>
      </div>
      <DailyReportSettingsDialog
        open={editing}
        onClose={() => setEditing(false)}
        settings={settings}
      />
    </section>
  )
}
