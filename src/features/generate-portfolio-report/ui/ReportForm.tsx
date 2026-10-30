import { FileText } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PERFORMANCE_RANGES, useReportJobs, useRequestReport } from '@/entities/portfolio'
import { isApiError } from '@/shared/api'
import { useLocale } from '@/shared/i18n'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { FileDrop } from '@/shared/ui/form/FileDrop'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Textarea } from '@/shared/ui/form/Textarea'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'
import {
  initialReportForm,
  MAX_COMMENTS_LENGTH,
  MAX_TITLE_LENGTH,
  REPORT_SECTIONS,
  toReportRequest,
  validateReportForm,
  type ReportFormState,
  type ReportPeriod,
} from '../model/reportForm'

const MAX_LOGO_SIZE = 1024 * 1024
const PERIODS: readonly ReportPeriod[] = [...PERFORMANCE_RANGES, 'custom']

interface ReportFormProps {
  portfolioId: string
  portfolioName: string
  /** The job the server queued, to follow it. */
  onQueued: (jobId: string) => void
}

/**
 * The customizable PDF report of spec section 4: period, sections, comments and the company's
 * logo. The server builds it as a job (POST /portfolios/{id}/reports).
 */
export function ReportForm({ portfolioId, portfolioName, onQueued }: ReportFormProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const today = useMarketDay()
  const [form, setForm] = useState(() => initialReportForm(portfolioName, today))
  const [logo, setLogo] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const request = useRequestReport(portfolioId)
  const addJob = useReportJobs((state) => state.add)
  const set = (patch: Partial<ReportFormState>) => setForm((current) => ({ ...current, ...patch }))
  const errors = submitted ? validateReportForm(form, today) : {}
  const message = (error: string | undefined) =>
    error && t(`portfolio.reports.errors.${error as 'required'}`)
  const serverErrors = isApiError(request.error, 400) ? (request.error.problem.errors ?? {}) : {}
  const generalError =
    request.error && Object.keys(serverErrors).length === 0 ? request.error.message : null

  const submit = () => {
    setSubmitted(true)
    if (Object.keys(validateReportForm(form, today)).length > 0) return
    request.mutate(
      { request: toReportRequest(form, locale, today), logo },
      {
        onSuccess: (job) => {
          addJob({ jobId: job.jobId, portfolioId })
          toast.info(t('portfolio.reports.queued', { title: job.title }))
          onQueued(job.jobId)
        },
      },
    )
  }

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
        <Field
          label={t('portfolio.reports.title')}
          error={message(errors.title) ?? serverErrors.title?.[0]}
        >
          <TextInput
            value={form.title}
            onChange={(title) => set({ title })}
            maxLength={MAX_TITLE_LENGTH}
            highlight
          />
        </Field>
        <Field label={t('portfolio.reports.period')} group>
          <SegmentedControl
            value={form.period}
            options={PERIODS.map((period) => ({
              value: period,
              label: t(`portfolio.reports.periods.${period}`),
            }))}
            onChange={(period) => set({ period })}
          />
        </Field>
        {form.period === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={t('portfolio.reports.from')}
              error={message(errors.from) ?? serverErrors.from?.[0]}
            >
              <DateInput value={form.from} onChange={(from) => set({ from })} highlight />
            </Field>
            <Field
              label={t('portfolio.reports.to')}
              error={message(errors.to) ?? serverErrors.to?.[0]}
            >
              <DateInput value={form.to} onChange={(to) => set({ to })} highlight />
            </Field>
          </div>
        )}
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 font-sans text-data text-secondary">
            {t('portfolio.reports.sections')}
          </legend>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {REPORT_SECTIONS.map((section) => (
              <Checkbox
                key={section}
                checked={form.sections.includes(section)}
                onChange={(checked) =>
                  set({
                    sections: checked
                      ? [...form.sections, section]
                      : form.sections.filter((value) => value !== section),
                  })
                }
                label={t(`portfolio.reports.sectionNames.${section}`)}
              />
            ))}
          </div>
          {errors.sections && (
            <p className="font-sans text-title text-down">
              {t('portfolio.reports.errors.sections')}
            </p>
          )}
        </fieldset>
        <Field label={t('portfolio.reports.comments')} hint={t('portfolio.reports.commentsHint')}>
          <Textarea
            value={form.comments}
            onChange={(comments) => set({ comments })}
            maxLength={MAX_COMMENTS_LENGTH}
            rows={4}
          />
        </Field>
        <Field label={t('portfolio.reports.logo')} error={serverErrors.logo?.[0]}>
          <FileDrop
            file={logo}
            onChange={setLogo}
            accept=".png,.jpg,.jpeg"
            maxSize={MAX_LOGO_SIZE}
          />
        </Field>
        {generalError && (
          <p role="alert" className="font-sans text-data text-down">
            {generalError}
          </p>
        )}
      </div>
      <div className="flex shrink-0 justify-end border-t p-2">
        <Button type="submit" variant="primary" icon={FileText} busy={request.isPending}>
          {t('portfolio.reports.generate')}
        </Button>
      </div>
    </form>
  )
}
