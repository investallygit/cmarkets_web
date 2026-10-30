import { clsx } from 'clsx'
import { Download, LoaderCircle, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePortfolio, useReportFile, useReportJob, useReportJobs } from '@/entities/portfolio'
import { useHasPermission } from '@/entities/session'
import { ReportForm } from '@/features/generate-portfolio-report'
import type { ReportJobDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { saveBlob } from '@/shared/lib/download'
import { Badge, type BadgeTone } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { PdfViewer } from '@/shared/ui/PdfViewer'
import { PanelEmpty, PanelError, PanelLoading } from '@/shared/ui/StatusViews'

/** PDF client reports are part of the Portfolio manager account (spec section 12). */
function LockedReports() {
  const { t } = useTranslation()
  return (
    <div className="flex h-full items-center justify-center gap-2 p-4 text-center font-sans text-label text-secondary">
      <Lock aria-hidden className="size-4 shrink-0" />
      {t('portfolio.reports.locked')}
    </div>
  )
}

interface ReportFormPanelProps {
  portfolioId: string
  onQueued: (jobId: string) => void
}

/** Screen 5, Reports tab: the report's options. API POST /portfolios/{id}/reports. */
export function PortfolioReportFormPanel({ portfolioId, onQueued }: ReportFormPanelProps) {
  const { t } = useTranslation()
  const canReport = useHasPermission('portfolios:reports')
  const portfolio = usePortfolio(portfolioId).data
  return (
    <Panel title={t('panels.newReport')} code="PORT">
      {!canReport ? (
        <LockedReports />
      ) : portfolio ? (
        <ReportForm
          key={portfolio.id}
          portfolioId={portfolio.id}
          portfolioName={portfolio.name}
          onQueued={onQueued}
        />
      ) : (
        <PanelLoading />
      )}
    </Panel>
  )
}

const STATUS_TONES: Record<ReportJobDto['status'], BadgeTone> = {
  queued: 'neutral',
  running: 'info',
  done: 'up',
  failed: 'down',
}

interface ReportsPanelProps {
  portfolioId: string
  selectedJobId: string | null
  onSelect: (jobId: string) => void
}

/**
 * The reports asked for since the screen opened, followed until the server has built them
 * (GET /reports/{jobId}); a click shows one, the arrow downloads it.
 */
export function PortfolioReportsPanel({ portfolioId, selectedJobId, onSelect }: ReportsPanelProps) {
  const { t } = useTranslation()
  const jobs = useReportJobs((state) => state.jobs).filter((job) => job.portfolioId === portfolioId)
  return (
    <Panel title={t('panels.reports')} code="PORT">
      {jobs.length === 0 ? (
        <PanelEmpty message={t('portfolio.reports.none')} />
      ) : (
        <ul className="h-full overflow-auto">
          {jobs.map((job, index) => (
            <ReportRow
              key={job.jobId}
              jobId={job.jobId}
              alternate={index % 2 === 1}
              selected={job.jobId === selectedJobId}
              onSelect={() => onSelect(job.jobId)}
            />
          ))}
        </ul>
      )}
    </Panel>
  )
}

function ReportRow({
  jobId,
  alternate,
  selected,
  onSelect,
}: {
  jobId: string
  alternate: boolean
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const job = useReportJob(jobId).data
  const file = useReportFile(job)
  if (!job) return null
  const status =
    job.status === 'running'
      ? t('portfolio.reports.running', { progress: job.progress })
      : t(`portfolio.reports.statuses.${job.status}`)
  return (
    <li
      className={clsx(
        'flex h-row items-center gap-2 pr-1 font-mono text-data',
        selected ? 'bg-selected' : alternate && 'bg-row-alt',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex min-w-0 flex-1 items-center gap-3 px-2 text-left hover:text-accent-amber"
      >
        <span className="shrink-0 text-secondary">{format.time(job.createdAt, true)}</span>
        <span className="truncate font-sans">{job.title}</span>
      </button>
      <Badge tone={STATUS_TONES[job.status]}>{status}</Badge>
      <Button
        variant="link"
        size="sm"
        icon={Download}
        disabled={!file.data || !job.fileName}
        aria-label={t('portfolio.reports.download', { title: job.title })}
        onClick={() => file.data && job.fileName && saveBlob(file.data, job.fileName)}
      />
    </li>
  )
}

/** The selected report in the browser's PDF viewer, once built. */
export function PortfolioReportPreviewPanel({ jobId }: { jobId: string | null }) {
  const { t } = useTranslation()
  return (
    <Panel title={t('panels.reportPreview')} code="PORT">
      {jobId ? (
        <ReportPreview jobId={jobId} />
      ) : (
        <PanelEmpty message={t('portfolio.reports.select')} />
      )}
    </Panel>
  )
}

function ReportPreview({ jobId }: { jobId: string }) {
  const { t } = useTranslation()
  const job = useReportJob(jobId)
  const file = useReportFile(job.data)
  if (job.isError) return <PanelError error={job.error} onRetry={() => void job.refetch()} />
  if (job.data?.status === 'failed') return <PanelEmpty message={job.data.error ?? undefined} />
  if (file.isError) return <PanelError error={file.error} onRetry={() => void file.refetch()} />
  if (!job.data || !file.data) {
    return (
      <div className="flex h-full items-center justify-center gap-2 font-sans text-data text-secondary">
        <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
        {job.data && job.data.status !== 'done'
          ? t('portfolio.reports.running', { progress: job.data.progress })
          : t('common.loading')}
      </div>
    )
  }
  return <PdfViewer file={file.data} title={job.data.title} />
}
