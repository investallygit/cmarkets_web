import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, useRefreshAdminData } from '@/shared/api/adminData'
import type { DailyReportDto, DailyReportSettingsInput } from '@/shared/api/contracts'
import { adminApi, rfqApi } from '@/shared/api/endpoints'

/** The BEAC's daily report is the Admin's (ROADMAP decision 17): its keys go with the Admin's data. */
export const rfqReportKeys = {
  all: [...ADMIN_QUERY_ROOT, 'rfq-reports'] as const,
  month: (month: string) => [...ADMIN_QUERY_ROOT, 'rfq-reports', 'month', month] as const,
  day: (date: string) => [...ADMIN_QUERY_ROOT, 'rfq-reports', 'day', date] as const,
  settings: () => [...ADMIN_QUERY_ROOT, 'rfq-reports', 'settings'] as const,
}

/** A scheduled day's agreements so far move through the day: read again each minute. */
const LIVE_MS = 60_000

/** GET /rfq/daily-reports?month=yyyy-MM: the month's business days, newest first, the next send. */
export function useDailyReports(month: string) {
  return useQuery({
    queryKey: rfqReportKeys.month(month),
    queryFn: ({ signal }) => rfqApi.dailyReports(month, signal),
    refetchInterval: LIVE_MS,
  })
}

/** GET /rfq/daily-reports/{date}: the day's figures and send panel, a preview before it is made. */
export function useDailyReport(date: string | null) {
  return useQuery({
    queryKey: rfqReportKeys.day(date ?? ''),
    queryFn: ({ signal }) => rfqApi.dailyReport(date ?? '', signal),
    enabled: date !== null,
    refetchInterval: (query) => (query.state.data?.preview ? LIVE_MS : false),
  })
}

/** GET /admin/rfq/daily-report-settings: the send time, the recipients, the next and last sends. */
export function useDailyReportSettings() {
  return useQuery({
    queryKey: rfqReportKeys.settings(),
    queryFn: ({ signal }) => adminApi.dailyReportSettings(signal),
  })
}

/**
 * POST /rfq/daily-reports/{date}/send: Send now, or Resend. The day as it stands after shows at
 * once; the month, the header and the settings' last send are read again.
 */
export function useSendDailyReport() {
  const client = useQueryClient()
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (date: string) => rfqApi.sendDailyReport(date),
    onSuccess: (report: DailyReportDto) => {
      client.setQueryData(rfqReportKeys.day(report.date), report)
      refresh()
    },
  })
}

/** PUT /admin/rfq/daily-report-settings, at the version read (409 when changed meanwhile). */
export function useSaveDailyReportSettings() {
  const client = useQueryClient()
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (settings: DailyReportSettingsInput) => adminApi.saveDailyReportSettings(settings),
    onSuccess: (settings) => {
      client.setQueryData(rfqReportKeys.settings(), settings)
      refresh()
    },
  })
}

/** The day's files as sent, or as they would be: the PDF summary, the Excel list. */
export function useDownloadDailyReport() {
  return useMutation({
    mutationFn: ({ date, kind }: { date: string; kind: 'summary' | 'transactions' }) =>
      kind === 'summary' ? rfqApi.dailyReportSummary(date) : rfqApi.dailyReportTransactions(date),
  })
}
