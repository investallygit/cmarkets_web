import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useAnalyst } from '@/entities/analyst'
import { ContactButton, typesByMode, useContactPermission, useProfile } from '@/entities/profile'
import { useLibrary } from '@/entities/publication'
import { useCurrentUser } from '@/entities/session'
import { FollowButton } from '@/features/follow-analyst'
import { ReportProfile } from '@/features/report-profile'
import { isApiError } from '@/shared/api'
import type { ClientAccountType, ProfileDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { analystPublicationsPath, libraryPath, messagesPath, routes } from '@/shared/routes/paths'
import { Button, ButtonLink } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { ProfileDetails } from './ProfileDetails'

const SECTION_TITLE =
  'font-sans text-title font-semibold tracking-title text-accent-amber uppercase'

/** The analyst's three latest publications, each with its price: they open in PUB. */
function LatestPublications({ analystId }: { analystId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const library = useLibrary({ tab: 'all', analystId, sort: 'recent', page: 1, pageSize: 3 })
  if (!library.data) return null
  return (
    <section className="flex flex-col gap-1.5">
      <h4 className={SECTION_TITLE}>{t('network.view.latestPublications')}</h4>
      {library.data.items.length === 0 ? (
        <p className="font-sans text-data text-secondary">{t('network.view.noPublication')}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {library.data.items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-3">
              <Link
                to={libraryPath(item.id)}
                className="truncate font-sans text-label hover:underline"
              >
                {item.title}
              </Link>
              {item.price === null ? (
                <span className="shrink-0 font-mono text-data text-up uppercase">
                  {t('publication.free')}
                </span>
              ) : (
                <span className="shrink-0 font-mono text-data text-accent-amber">
                  {t('publication.priceXaf', { price: format.number(item.price, 0) })}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Who may write, by type, and the contact details the profile shows (spec section 15). */
function ProfileContact({ profile }: { profile: ProfileDto }) {
  const { t } = useTranslation()
  const groups = typesByMode({ visibility: 'members', contactRules: profile.contactRules })
  const names = (types: ClientAccountType[]) =>
    types.map((type) => t(`accountBadge.${type}`)).join(', ')
  const { workEmail, phone } = profile.contact
  return (
    <section className="flex flex-col gap-1">
      <h4 className={SECTION_TITLE}>{t('network.view.contact')}</h4>
      <ul className="flex flex-col gap-0.5 font-sans text-label">
        {groups.direct.length > 0 && (
          <li>{t('network.view.acceptsFrom', { types: names(groups.direct) })}</li>
        )}
        {groups.request.length > 0 && (
          <li className="text-accent-amber">
            {t('network.view.requestFrom', { types: names(groups.request) })}
          </li>
        )}
        {groups.none.length > 0 && (
          <li className="text-secondary">
            {t('network.view.closedTo', { types: names(groups.none) })}
          </li>
        )}
        {!workEmail && !phone ? (
          <li className="text-secondary">{t('network.view.detailsHidden')}</li>
        ) : (
          <>
            <li className={workEmail ? undefined : 'text-secondary'}>
              {workEmail ? (
                <a href={`mailto:${workEmail}`} className="text-info hover:underline">
                  {t('network.view.email', { value: workEmail })}
                </a>
              ) : (
                t('network.view.emailHidden')
              )}
            </li>
            <li className={phone ? undefined : 'text-secondary'}>
              {phone ? (
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-info hover:underline">
                  {t('network.view.phone', { value: phone })}
                </a>
              ) : (
                t('network.view.phoneHidden')
              )}
            </li>
          </>
        )}
      </ul>
    </section>
  )
}

/** The buttons of a profile: write, follow an analyst, read their publications, report. */
function ProfileActions({ profile }: { profile: ProfileDto }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const permission = useContactPermission(profile.userId)
  const analyst = useAnalyst(profile.analystId)
  return (
    <div className="mt-auto flex flex-col gap-2 border-t pt-3">
      {permission.isPending ? (
        <Button size="xl" busy className="w-full">
          {t('network.view.sendMessage')}
        </Button>
      ) : (
        <ContactButton
          mode={permission.data?.mode ?? 'none'}
          variant="profile"
          // MSG opens the conversation with the person, or the one already open.
          onContact={() => void navigate(messagesPath({ to: profile.userId }))}
          className="w-full"
        />
      )}
      {analyst.data && <FollowButton analyst={analyst.data} variant="button" className="w-full" />}
      {profile.analystId && (
        <ButtonLink to={analystPublicationsPath(profile.analystId)} variant="info" size="lg">
          {t('network.view.publications')}
        </ButtonLink>
      )}
      <ReportProfile userId={profile.userId} displayName={profile.displayName} className="w-full" />
    </div>
  )
}

/**
 * NET, right (spec section 9, screen 10): the profile chosen among the results, its latest
 * publications and its contact rules; the user's own card leads to NET ME instead.
 */
export function DirectoryProfilePanel({ userId }: { userId: string | null }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const profile = useProfile(userId)
  return (
    <Panel
      title={t('panels.profile')}
      code="NET"
      options={profile.data && <span className="truncate">{profile.data.displayName}</span>}
    >
      {!userId ? (
        <PanelEmpty message={t('network.view.select')} />
      ) : isApiError(profile.error, 404) ? (
        <PanelEmpty message={t('network.view.notFound')} />
      ) : (
        <QueryView query={profile}>
          {(data) => (
            <div className="flex min-h-full flex-col gap-4 p-3">
              <ProfileDetails profile={data} headingLevel={3} />
              {data.analystId && <LatestPublications analystId={data.analystId} />}
              <ProfileContact profile={data} />
              {data.userId === user.id ? (
                <div className="mt-auto flex flex-col gap-2 border-t pt-3">
                  <p className="font-sans text-data text-secondary">{t('network.view.yours')}</p>
                  <ButtonLink to={routes.networkProfile} variant="primary" size="xl">
                    {t('network.directory.editMine')}
                  </ButtonLink>
                </div>
              ) : (
                <ProfileActions profile={data} />
              )}
            </div>
          )}
        </QueryView>
      )}
    </Panel>
  )
}
