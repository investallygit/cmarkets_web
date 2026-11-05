import { useTranslation } from 'react-i18next'
import { ReportDecision } from '@/features/moderate-report'
import type { ReportedItemDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { useReportText } from '../model/useReportText'
import { ReportedAccount, ReportedConversation, ReportedProfile } from './ReportedContent'
import { ReportTags } from './ReportTags'

/**
 * MOD, a reported profile or conversation opened: its reports, whether the account is referred
 * to the Admin, Dismiss the reports; the profile, or the conversation the Admin reads on request,
 * and the account with its actions.
 */
export function ReportReaderPanel({ item }: { item: ReportedItemDto | null }) {
  const { t } = useTranslation()
  const format = useFormat()
  const { reason } = useReportText()
  const account = item?.account

  return (
    <Panel
      title={
        item?.type === 'conversation'
          ? t('panels.reportedConversation')
          : t('panels.reportedProfile')
      }
      code="MOD"
      bodyClassName="flex flex-col"
    >
      {item === null ? (
        <PanelEmpty message={t('directoryReports.choose')} />
      ) : (
        <>
          <div className="flex shrink-0 flex-col gap-2 border-b p-3 font-sans text-data">
            <div className="flex flex-wrap items-center gap-3">
              <ReportTags item={item} />
              <h3 className="min-w-0 flex-1 truncate text-label font-semibold">{item.title}</h3>
              <ReportDecision item={item} />
            </div>
            {account && (
              <p role="note" className={account.referred ? 'text-down' : 'text-secondary'}>
                {t(
                  account.referred ? 'directoryReports.referred' : 'directoryReports.openReports',
                  {
                    count: account.openReports,
                    name: account.displayName,
                  },
                )}
              </p>
            )}
            <ul className="flex flex-col gap-1" aria-label={t('moderation.reportsList')}>
              {item.reports.map((report) => (
                <li key={report.id} className="border-l-2 border-accent-amber pl-2">
                  <span className="font-semibold">{reason(item.type, report)}</span>
                  {report.comment && <span> · “{report.comment}”</span>}
                  <span className="block text-secondary">
                    {t('directoryReports.reportedBy', {
                      name: report.reportedBy.displayName,
                      type: t(`accountTypes.${report.reportedBy.accountType}`),
                      date: `${format.date(report.reportedAt)} ${format.time(report.reportedAt)}`,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-4 p-3">
              {item.type === 'profile' ? (
                <ReportedProfile userId={item.id} />
              ) : (
                <ReportedConversation key={item.id} item={item} />
              )}
              {account && <ReportedAccount userId={account.userId} />}
            </div>
          </ScrollArea>
        </>
      )}
    </Panel>
  )
}
