import { useTranslation } from 'react-i18next'
import { millions, useDailyReport } from '@/entities/rfq-report'
import type { DailyReportDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'

/**
 * Screen 24's "PDF summary preview" (API /rfq/daily-reports/{date}): the one page of the selected
 * day "as it will be or was sent", drawn from the figures it was made of: the header and the scope,
 * the key figures, by security, by residual maturity, the list of trades, the footer with the
 * time, the fingerprint and the note that the amounts are indicative. Download PDF gives the file.
 */
export function SummaryPreviewPanel({ date }: { date: string | null }) {
  const { t } = useTranslation()
  const format = useFormat()
  const report = useDailyReport(date)
  const pages = report.data?.files.find((file) => file.kind === 'summary')?.pages
  return (
    <Panel
      title={
        date
          ? `${t('panels.rfqReportPreview')} · ${format.isoDate(date)}`
          : t('panels.rfqReportPreview')
      }
      code="RFQ REP"
      options={
        pages ? (
          <span className="font-mono text-label text-secondary uppercase">
            {t('rfqReports.preview.pages', { count: pages })}
          </span>
        ) : undefined
      }
    >
      {date === null ? (
        <p className="p-3 font-sans text-data text-secondary">{t('rfqReports.preview.pick')}</p>
      ) : (
        <QueryView query={report}>
          {(data) => (
            <ScrollArea className="min-h-0 flex-1 bg-app p-3">
              <SummaryPage report={data} />
            </ScrollArea>
          )}
        </QueryView>
      )}
    </Panel>
  )
}

function SummaryPage({ report }: { report: DailyReportDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const { figures } = report
  const nil = figures.agreementCount === 0 && figures.cancellations.agreementCount === 0
  const xaf = (value: number) =>
    t('rfqReports.preview.xafMillions', { value: millions(value, format.number) })
  const local = (instant: string) => `${format.date(instant)} ${format.time(instant)}`
  const list = report.files.find((file) => file.kind === 'transactions')
  const keyFigures = [
    [t('rfqReports.preview.agreements'), String(figures.agreementCount)],
    [t('rfqReports.preview.face'), xaf(figures.faceAmount)],
    [t('rfqReports.preview.settlement'), xaf(figures.settlementAmount)],
    [t('rfqReports.preview.securities'), String(figures.securityCount)],
  ] as const

  return (
    <article
      aria-label={t('panels.rfqReportPreview')}
      className="mx-auto flex max-w-3xl flex-col gap-4 border bg-panel p-5 font-sans text-data text-primary"
    >
      <header className="flex flex-col gap-1 border-b pb-3">
        <h3 className="text-label font-semibold">{t('rfqReports.preview.title')}</h3>
        <p className="text-secondary">
          {t('rfqReports.preview.subtitle', {
            day: `${format.weekday(report.date, 'long')} ${format.isoDate(report.date)}`,
          })}
        </p>
        <p className="text-secondary">
          {report.period.from
            ? t('rfqReports.preview.period', {
                from: local(report.period.from),
                to: local(report.period.to),
              })
            : t('rfqReports.preview.periodFirst', { to: local(report.period.to) })}
        </p>
        {report.preview && <p className="text-info">{t('rfqReports.preview.notMade')}</p>}
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {keyFigures.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="text-secondary">{label}</dt>
            <dd className="font-mono text-label font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="rfq-report-by-security" className="flex flex-col gap-1">
        <h4
          id="rfq-report-by-security"
          className="text-title font-semibold tracking-title text-accent-amber uppercase"
        >
          {t('rfqReports.preview.bySecurity')}
        </h4>
        {figures.bySecurity.length === 0 ? (
          <p className="text-secondary">{t('rfqReports.preview.noTrade')}</p>
        ) : (
          <ScrollArea>
            <table className="w-full font-mono tabular-nums">
              <thead className="font-sans text-secondary">
                <tr>
                  <th scope="col" className="py-1 pr-2 text-left font-normal">
                    {t('rfqReports.preview.security')}
                  </th>
                  <th scope="col" className="py-1 pr-2 text-left font-normal">
                    {t('rfqReports.preview.type')}
                  </th>
                  <th scope="col" className="py-1 pr-2 text-right font-normal">
                    {t('rfqReports.preview.agreementCount')}
                  </th>
                  <th scope="col" className="py-1 pr-2 text-right font-normal">
                    {t('rfqReports.preview.faceMillions')}
                  </th>
                  <th scope="col" className="py-1 text-left font-normal">
                    {t('rfqReports.preview.averages')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {figures.bySecurity.map((security) => (
                  <tr key={security.securityId} className="border-t even:bg-row-alt">
                    <th
                      scope="row"
                      className="py-1 pr-2 text-left font-sans font-normal"
                      title={security.name}
                    >
                      {security.code}
                    </th>
                    <td className="py-1 pr-2">{security.type}</td>
                    <td className="py-1 pr-2 text-right">{security.agreementCount}</td>
                    <td className="py-1 pr-2 text-right">
                      {millions(security.faceAmount, format.number)}
                    </td>
                    <td className="py-1">
                      {security.averagePrice === null
                        ? format.percent(security.averageRatePct, 2, false)
                        : `${format.number(security.averagePrice, 2)} · ${format.percent(security.averageRatePct, 2, false)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <th scope="row" className="py-1 pr-2 text-left font-sans">
                    {t('rfqReports.preview.total')}
                  </th>
                  <td />
                  <td className="py-1 pr-2 text-right">{figures.agreementCount}</td>
                  <td className="py-1 pr-2 text-right">
                    {millions(figures.faceAmount, format.number)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </ScrollArea>
        )}
        {figures.cancellations.agreementCount > 0 && (
          <p className="text-warning">
            {t('rfqReports.preview.cancellations', {
              count: figures.cancellations.agreementCount,
              face: millions(figures.cancellations.faceAmount, format.number),
            })}
          </p>
        )}
      </section>

      <section aria-labelledby="rfq-report-by-maturity" className="flex flex-col gap-1">
        <h4
          id="rfq-report-by-maturity"
          className="text-title font-semibold tracking-title text-accent-amber uppercase"
        >
          {t('rfqReports.preview.byMaturity')}
        </h4>
        <table className="w-full font-mono tabular-nums">
          <tbody>
            {figures.byMaturity.map((bucket) => (
              <tr key={bucket.bucket}>
                <th scope="row" className="w-32 py-0.5 pr-2 text-left font-sans font-normal">
                  {t(`rfqReports.preview.buckets.${bucket.bucket}`)}
                </th>
                <td className="py-0.5 pr-2" aria-hidden="true">
                  <span
                    className="block h-3 bg-accent-amber"
                    style={{ width: `${bucket.sharePct}%` }}
                  />
                </td>
                <td className="w-16 py-0.5 pr-2 text-right">
                  {millions(bucket.faceAmount, format.number)}
                </td>
                <td className="w-16 py-0.5 text-right text-secondary">
                  {format.percent(bucket.sharePct, 1, false)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="rfq-report-trades" className="flex flex-col gap-1">
        <h4
          id="rfq-report-trades"
          className="text-title font-semibold tracking-title text-accent-amber uppercase"
        >
          {t('rfqReports.preview.trades')}
        </h4>
        <p>
          {nil
            ? t('rfqReports.preview.nil')
            : t('rfqReports.preview.tradesFile', {
                count: figures.agreementCount + figures.cancellations.agreementCount,
                file: `CMarket_BEAC_transactions_${report.date.replaceAll('-', '')}.xlsx`,
              })}
        </p>
      </section>

      <footer className="flex flex-col gap-0.5 border-t pt-3 text-secondary">
        {report.madeAt && (
          <p>
            {/* The job sends what it makes; a report made by Send now went first with an Admin's name. */}
            {t(
              report.sends.at(-1)?.by
                ? 'rfqReports.preview.generatedByAdmin'
                : 'rfqReports.preview.generated',
              {
                date: format.date(report.madeAt),
                time: format.time(report.madeAt),
              },
            )}
          </p>
        )}
        <p className="break-all">
          {list
            ? t('rfqReports.preview.fingerprint', { sha: list.sha256 })
            : t(
                report.preview
                  ? 'rfqReports.preview.noFingerprint'
                  : 'rfqReports.preview.nilFingerprint',
              )}
        </p>
        <p>{t('rfqReports.preview.indicative')}</p>
      </footer>
    </article>
  )
}
