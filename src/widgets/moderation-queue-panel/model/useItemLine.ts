import { useTranslation } from 'react-i18next'
import type { ModerationItemDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'

/** "by M. Ndong · Reason: ...", or why a publication waits. */
export function useItemLine() {
  const { t } = useTranslation()
  const format = useFormat()
  return (item: ModerationItemDto) => {
    const [report] = item.reports
    const why =
      item.kind === 'reported' && report
        ? t('moderation.reason', {
            reason: report.comment || t(`contentReport.reasons.${report.reason}`),
          })
        : item.firstPublication
          ? t('moderation.firstPublication')
          : t('moderation.submitted', { date: format.date(item.since) })
    const more =
      item.reports.length > 1 ? ` (${t('moderation.reports', { count: item.reports.length })})` : ''
    return `${t('moderation.by', { name: item.analyst.displayName })} · ${why}${more}`
  }
}
