import { useTranslation } from 'react-i18next'
import { ModerationTag, useModeratedPublication } from '@/entities/moderation'
import { PublicationReader } from '@/entities/publication'
import { ModerationDecision } from '@/features/moderate-publication'
import type { ModerationItemDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { useItemLine } from '../model/useItemLine'

/**
 * MOD, the publication opened: why it is in the queue, the readers' reports, Approve or Take down,
 * and the whole text as readers see it, or will once approved (the PUB reader).
 */
export function ModerationReaderPanel({ item }: { item: ModerationItemDto | null }) {
  const { t } = useTranslation()
  const format = useFormat()
  const line = useItemLine()
  const publication = useModeratedPublication(item?.publicationId ?? null)

  return (
    <Panel title={t('panels.moderationReader')} code="MOD" bodyClassName="flex flex-col">
      {item === null ? (
        <PanelEmpty message={t('moderation.choose')} />
      ) : (
        <>
          <div className="flex shrink-0 flex-col gap-2 border-b p-3 font-sans text-data">
            <div className="flex flex-wrap items-center gap-3">
              <ModerationTag item={item} />
              <p className="min-w-0 flex-1 truncate text-secondary">{line(item)}</p>
              <ModerationDecision item={item} variant="buttons" />
            </div>
            {item.reports.length > 0 && (
              <ul className="flex flex-col gap-1" aria-label={t('moderation.reportsList')}>
                {item.reports.map((report) => (
                  <li key={report.id} className="border-l-2 border-accent-amber pl-2">
                    <span className="font-semibold">
                      {t(`contentReport.reasons.${report.reason}`)}
                    </span>
                    {report.comment && <span> · “{report.comment}”</span>}
                    <span className="block text-secondary">
                      {t('moderation.reportedBy', {
                        name: report.reportedBy,
                        date: `${format.date(report.reportedAt)} ${format.time(report.reportedAt)}`,
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <QueryView query={publication}>
              {(view) => <PublicationReader publication={view} />}
            </QueryView>
          </ScrollArea>
        </>
      )}
    </Panel>
  )
}
