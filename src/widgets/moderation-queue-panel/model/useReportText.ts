import { useTranslation } from 'react-i18next'
import { CONVERSATION_REPORT_REASONS } from '@/entities/conversation'
import { PROFILE_REPORT_REASONS } from '@/entities/profile'
import type { AdminReportDto, ReportedItemDto } from '@/shared/api/contracts'

/** The reports of a profile or a conversation in the user's language. */
export function useReportText() {
  const { t } = useTranslation()

  /** "Spam or solicitation", from the reasons of a profile's or a conversation's report. */
  const reason = (type: ReportedItemDto['type'], report: Pick<AdminReportDto, 'reason'>) => {
    if (type === 'profile') {
      const known = PROFILE_REPORT_REASONS.find((value) => value === report.reason)
      return known ? t(`network.report.reasons.${known}`) : report.reason
    }
    const known = CONVERSATION_REPORT_REASONS.find((value) => value === report.reason)
    return known ? t(`messaging.report.reasons.${known}`) : report.reason
  }

  /** "3 reports · Reason: Sends the same offer to every analyst", from the latest. */
  const line = (item: ReportedItemDto) => {
    const [latest] = item.reports
    return t('directoryReports.line', {
      reports: t('moderation.reports', { count: item.reports.length }),
      reason: t('moderation.reason', {
        reason: latest ? latest.comment || reason(item.type, latest) : '',
      }),
    })
  }

  return { reason, line }
}
