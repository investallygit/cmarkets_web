import { rangeFrom, type PerformanceRange } from '@/entities/portfolio'
import type { ReportRequestDto, ReportSection } from '@/shared/api/contracts'

export const REPORT_SECTIONS: readonly ReportSection[] = [
  'positions',
  'performance',
  'risk',
  'income',
  'transactions',
]
export const MAX_TITLE_LENGTH = 80
export const MAX_COMMENTS_LENGTH = 2000

export type ReportPeriod = PerformanceRange | 'custom'

export interface ReportFormState {
  title: string
  period: ReportPeriod
  /** Custom period only. */
  from: string | null
  to: string | null
  sections: ReportSection[]
  comments: string
}

export type ReportFormErrors = Partial<
  Record<'title' | 'from' | 'to' | 'sections', 'required' | 'order' | 'future'>
>

/** A client report of the year to date, every section but the transactions. */
export function initialReportForm(portfolioName: string, today: string): ReportFormState {
  return {
    title: portfolioName,
    period: 'ytd',
    from: null,
    to: today,
    sections: ['positions', 'performance', 'risk', 'income'],
    comments: '',
  }
}

export function validateReportForm(form: ReportFormState, today: string): ReportFormErrors {
  const errors: ReportFormErrors = {}
  if (form.title.trim() === '') errors.title = 'required'
  if (form.sections.length === 0) errors.sections = 'required'
  if (form.period === 'custom') {
    if (!form.from) errors.from = 'required'
    if (!form.to) errors.to = 'required'
    else if (form.to > today) errors.to = 'future'
    if (form.from && form.to && form.from >= form.to) errors.from = 'order'
  }
  return errors
}

/** The options of POST /portfolios/{id}/reports; call it on a form without errors. */
export function toReportRequest(
  form: ReportFormState,
  language: 'fr' | 'en',
  today: string,
): ReportRequestDto {
  const custom = form.period === 'custom'
  return {
    title: form.title.trim(),
    from: custom ? form.from : rangeFrom(form.period as PerformanceRange, today),
    to: custom ? (form.to ?? today) : today,
    sections: REPORT_SECTIONS.filter((section) => form.sections.includes(section)),
    comments: form.comments.trim(),
    language,
  }
}
