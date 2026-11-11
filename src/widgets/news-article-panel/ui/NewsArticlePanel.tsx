import { ExternalLink, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { NewsBody, NewsTags, useNewsArticle, useNewsView } from '@/entities/news'
import { QuoteCard } from '@/entities/quote'
import { ReportNews } from '@/features/report-news'
import { ShareNewsActions } from '@/features/share-news'
import { isApiError } from '@/shared/api'
import type { NewsArticleDto } from '@/shared/api/contracts'
import { resolveApiUrl } from '@/shared/config/env'
import { useFormat } from '@/shared/i18n'
import { securityPath } from '@/shared/routes/paths'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

/**
 * The content of a news item (spec section 16): its two tags, subject and headline, an ARTICLE's
 * standfirst, body (the studio's document: its images with their credit, its "CMarket security"
 * cards with their live price) and PDF, or a FLASH's text; its author and original link, the
 * securities it concerns. API /news/{id}; shown 3 seconds in an active tab, it counts the unique click. Its
 * title bar copies the item's address (/n?article={id}) or sends it to a conversation; its footer
 * reports it to the moderators (ROADMAP step 27).
 */
export function NewsArticlePanel({ articleId }: { articleId: string | null }) {
  const { t } = useTranslation()
  const article = useNewsArticle(articleId)

  return (
    <Panel
      title={t('panels.article')}
      code="N"
      options={article.data && <ShareNewsActions article={article.data} />}
    >
      {!articleId ? (
        <PanelEmpty message={t('news.select')} />
      ) : isApiError(article.error, 404) ? (
        // A shared address whose item is gone, or was never there.
        <PanelEmpty message={t('news.notFound')} />
      ) : (
        <QueryView query={article}>{(item) => <NewsContent key={item.id} item={item} />}</QueryView>
      )}
    </Panel>
  )
}

function NewsContent({ item }: { item: NewsArticleDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  // The content shows: its unique click once it has 3 seconds in an active tab.
  useNewsView(item.id)

  return (
    <article lang={item.language} className="flex max-w-3xl flex-col gap-3 p-3">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-data">
        <NewsTags type={item.type} source={item.source} />
        {item.subject && <span className="font-semibold text-accent-amber">{item.subject}</span>}
        <span className="text-secondary">
          {format.date(item.publishedAt)} {format.time(item.publishedAt)}
        </span>
      </p>
      <h3 className="font-sans text-figure font-semibold">{item.headline}</h3>
      <p
        className={
          item.type === 'flash' ? 'font-sans text-label' : 'font-sans text-label font-semibold'
        }
      >
        {item.summary}
      </p>
      {item.body && (
        <NewsBody
          body={item.body}
          renderSecurity={(securityId, code) => <QuoteCard securityId={securityId} code={code} />}
        />
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
            item.updatedAt &&
              t('news.updatedOn', {
                date: `${format.date(item.updatedAt)} ${format.time(item.updatedAt)}`,
              }),
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
            {t('news.original')}
            <ExternalLink aria-hidden className="size-3" />
            <span className="sr-only">{t('news.newTab')}</span>
          </a>
        )}
        {item.securityIds.length > 0 && (
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {t('news.related')}
            {item.securityIds.map((securityId) => (
              <Link
                key={securityId}
                to={securityPath(securityId)}
                className="font-mono text-info underline underline-offset-2"
              >
                {securityId}
              </Link>
            ))}
          </span>
        )}
        <span className="self-start">
          <ReportNews newsId={item.id} />
        </span>
      </footer>
    </article>
  )
}
