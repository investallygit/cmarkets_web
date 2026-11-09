import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useNewsArticle } from '@/entities/news'
import { ShareNewsActions } from '@/features/share-news'
import { isApiError } from '@/shared/api'
import { useFormat } from '@/shared/i18n'
import { securityPath } from '@/shared/routes/paths'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

/**
 * The full text of a news item, with links to the securities it concerns. API /news/{id}. Its
 * title bar copies the article's address (/n?article={id}) or sends it to a conversation, so
 * members share it.
 */
export function NewsArticlePanel({ articleId }: { articleId: string | null }) {
  const { t } = useTranslation()
  const format = useFormat()
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
        // A shared address whose article is gone, or was never there.
        <PanelEmpty message={t('news.notFound')} />
      ) : (
        <QueryView query={article}>
          {(item) => (
            <article className="flex max-w-3xl flex-col gap-3 p-3">
              <p className="font-mono text-data">
                <span className="font-semibold text-accent-amber">{item.source}</span>
                <span className="text-secondary">
                  {' '}
                  · {format.date(item.publishedAt)} {format.time(item.publishedAt)}
                </span>
              </p>
              <h3 className="font-sans text-figure font-semibold">{item.headline}</h3>
              {item.body.map((paragraph) => (
                <p key={paragraph} className="font-sans text-label leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {item.securityIds.length > 0 && (
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t pt-2 font-sans text-data text-secondary">
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
                </p>
              )}
            </article>
          )}
        </QueryView>
      )}
    </Panel>
  )
}
