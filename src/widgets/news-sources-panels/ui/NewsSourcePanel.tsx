import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { NewsSourceTag } from '@/entities/news'
import { useAdminNewsSource } from '@/entities/news-source'
import { NewsSourceForm, NewsSourceLogo } from '@/features/edit-news-source'
import type { AdminNewsSourceDetailsDto } from '@/shared/api/contracts'
import { adminUserPath } from '@/shared/routes/paths'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

/**
 * SRC, a newspaper: its logo, its description, verification and review mode, a partner
 * newspaper's contract, its media and the News providers who publish under its name (USER opens
 * each).
 */
export function NewsSourcePanel({ sourceId }: { sourceId: string | null }) {
  const { t } = useTranslation()
  const details = useAdminNewsSource(sourceId)
  return (
    <Panel title={t('panels.newsSource')} code="SRC">
      {!sourceId ? (
        <PanelEmpty message={t('newsSources.pick')} />
      ) : (
        <QueryView query={details}>
          {(found) => <Details key={found.source.id} details={found} />}
        </QueryView>
      )}
    </Panel>
  )
}

function Details({ details }: { details: AdminNewsSourceDetailsDto }) {
  const { t } = useTranslation()
  const { source, members } = details
  return (
    <div className="flex flex-col gap-4 p-3">
      <p className="flex flex-wrap items-center gap-2 font-sans text-data">
        <NewsSourceTag source={source} mode="none" />
        <span className="font-semibold">{source.name}</span>
        <span className="text-secondary">{t(`news.channels.${source.channel}`)}</span>
        {source.domain && <span className="font-mono text-secondary">{source.domain}</span>}
      </p>
      <section aria-label={t('newsSources.logo')}>
        <NewsSourceLogo source={source} />
      </section>
      <NewsSourceForm key={JSON.stringify(source)} source={source} />
      {source.channel === 'partner' && (
        <section
          aria-labelledby={`members-${source.id}`}
          className="flex flex-col gap-2 border-t pt-3"
        >
          <h3
            id={`members-${source.id}`}
            className="font-sans text-title font-semibold tracking-title text-accent-amber uppercase"
          >
            {t('newsSources.members')}
            {source.organization && (
              <span className="ml-2 normal-case text-secondary">{source.organization.name}</span>
            )}
          </h3>
          {members.length === 0 ? (
            <p className="font-sans text-data text-secondary">{t('newsSources.noMembers')}</p>
          ) : (
            <ul className="flex flex-col gap-1 font-sans text-data">
              {members.map((member) => (
                <li key={member.id} className="flex flex-wrap items-baseline gap-x-2">
                  <Link
                    to={adminUserPath(member.id)}
                    className="inline-flex min-h-6 items-center font-semibold text-info underline underline-offset-2"
                  >
                    {member.displayName}
                  </Link>
                  <span className="font-mono text-secondary">{member.email}</span>
                  <span className={member.status === 'suspended' ? 'text-down' : 'text-secondary'}>
                    {t(`accounts.statuses.${member.status}`)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
