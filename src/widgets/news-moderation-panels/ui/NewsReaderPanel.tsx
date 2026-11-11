import { ExternalLink, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useModeratedNews } from '@/entities/moderation'
import { NewsBody, NewsStatusBadge, NewsTags } from '@/entities/news'
import { QuoteCard } from '@/entities/quote'
import { NewsDecision } from '@/features/moderate-news'
import { isApiError } from '@/shared/api'
import type { ModeratedNewsDto } from '@/shared/api/contracts'
import { resolveApiUrl } from '@/shared/config/env'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

/**
 * The news item a moderator opened (NEWS, MOD; GET /admin/news/{id}): as readers see it, or will
 * once approved, with why it waits, the AI's confidence, its readers' reports, and the decisions:
 * approve or keep, take down, retype.
 */
export function NewsReaderPanel({ newsId, code }: { newsId: string | null; code: string }) {
  const { t } = useTranslation()
  const item = useModeratedNews(newsId)
  return (
    <Panel title={t('panels.newsReader')} code={code}>
      {!newsId ? (
        <PanelEmpty message={t('newsModeration.pick')} />
      ) : isApiError(item.error, 404) ? (
        <PanelEmpty message={t('news.notFound')} />
      ) : (
        <QueryView query={item}>{(news) => <ModeratedItem key={news.id} item={news} />}</QueryView>
      )}
    </Panel>
  )
}

function ModeratedItem({ item }: { item: ModeratedNewsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const at = (date: string) => `${format.date(date)} ${format.time(date)}`
  const why = [
    item.status === 'pending' &&
      item.holdReason &&
      t(`newsModeration.holdReasons.${item.holdReason}`),
    item.confidence !== null &&
      t('newsModeration.confidence', { value: format.number(item.confidence, 2) }),
    item.status === 'pending' &&
      item.submittedAt &&
      t('newsModeration.submitted', { date: at(item.submittedAt) }),
    item.publishAt &&
      item.status !== 'published' &&
      t('newsModeration.publishAt', { date: at(item.publishAt) }),
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-3 p-3">
      <NewsDecision item={item} />
      {item.status === 'withdrawn' && item.withdrawnAt && (
        <p
          role="status"
          className="border border-down/60 px-2 py-1.5 font-sans text-data text-down"
        >
          {t('newsModeration.withdrawn', {
            date: at(item.withdrawnAt),
            reason: item.withdrawalReason ?? '',
          })}
        </p>
      )}
      {why.length > 0 && <p className="font-sans text-data text-accent-amber">{why.join(' · ')}</p>}
      <article lang={item.language} className="flex max-w-3xl flex-col gap-3">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-data">
          <NewsStatusBadge status={item.status} />
          <NewsTags type={item.type} source={item.source} mode="none" />
          {item.subject && <span className="font-semibold text-accent-amber">{item.subject}</span>}
          {item.publishedAt && <span className="text-secondary">{at(item.publishedAt)}</span>}
        </p>
        <h3 className="font-sans text-figure font-semibold">{item.headline}</h3>
        <p
          className={
            item.type === 'flash' ? 'font-sans text-label' : 'font-sans text-label font-semibold'
          }
        >
          {item.summary}
        </p>
        {item.body ? (
          <NewsBody
            body={item.body}
            renderSecurity={(securityId, code) => <QuoteCard securityId={securityId} code={code} />}
          />
        ) : (
          item.type === 'article' && (
            <p className="font-sans text-data text-secondary">{t('newsModeration.noBody')}</p>
          )
        )}
        {item.attachment && (
          <a
            href={resolveApiUrl(item.attachment.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 self-start font-sans text-data text-info underline underline-offset-2"
          >
            <FileText aria-hidden className="size-3.5" />
            {t('newsStudio.editor.attachment', {
              name: item.attachment.fileName,
              size: format.fileSize(item.attachment.size),
            })}
            <span className="sr-only">{t('news.newTab')}</span>
          </a>
        )}
        <footer
          lang={format.locale}
          className="flex flex-col gap-1 border-t pt-2 font-sans text-data text-secondary"
        >
          <span>
            {[
              item.source.name,
              t(`news.channels.${item.source.channel}`),
              item.author && t('news.byAuthor', { author: item.author }),
              item.updatedAt && t('news.updatedOn', { date: at(item.updatedAt) }),
              item.countries.join(', '),
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          {item.source.originalUrl && (
            <a
              href={item.source.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 self-start text-info underline underline-offset-2"
            >
              {t('newsModeration.original')}
              <ExternalLink aria-hidden className="size-3" />
              <span className="sr-only">{t('news.newTab')}</span>
            </a>
          )}
          {item.securityIds.length > 0 && (
            <span className="font-mono">{item.securityIds.join(', ')}</span>
          )}
        </footer>
      </article>
      {item.reports.length > 0 && (
        <section
          aria-labelledby={`reports-${item.id}`}
          className="flex flex-col gap-2 border-t pt-2"
        >
          <h4
            id={`reports-${item.id}`}
            className="font-sans text-title font-semibold tracking-title text-accent-amber uppercase"
          >
            {t('newsModeration.reports')}
          </h4>
          <ul className="flex flex-col gap-2">
            {item.reports.map((report) => (
              <li key={report.id} className="flex flex-col gap-0.5 font-sans text-data">
                <span className="font-semibold text-down">
                  {t(`contentReport.reasons.${report.reason}`)}
                </span>
                {report.comment && <span>{report.comment}</span>}
                <span className="text-secondary">
                  {t('newsModeration.reportedBy', {
                    name: report.reportedBy,
                    date: at(report.reportedAt),
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
