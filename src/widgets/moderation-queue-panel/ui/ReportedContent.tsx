import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountStatusText, AccountTypeText, useAccount } from '@/entities/account'
import { useReportedConversation } from '@/entities/moderation'
import { ProfileCard, useProfile, useSpecialties } from '@/entities/profile'
import { AccountActions } from '@/features/manage-account'
import type { ReportedItemDto, SharedObjectDto } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { adminUserPath } from '@/shared/routes/paths'
import { Button, ButtonLink } from '@/shared/ui/form/Button'
import { QueryView } from '@/shared/ui/QueryView'

const SECTION_TITLE =
  'font-sans text-title font-semibold tracking-title text-accent-amber uppercase'

/** The reported profile as the directory shows it, then its About: what the reports are about. */
export function ReportedProfile({ userId }: { userId: string }) {
  const locale = useLocale()
  const profile = useProfile(userId)
  const specialties = useSpecialties().data ?? []
  return (
    <QueryView query={profile}>
      {(data) => (
        <div className="flex flex-col gap-2">
          <ProfileCard
            profile={{
              ...data,
              specialties: data.specialties.map(
                (id) => specialties.find((specialty) => specialty.id === id)?.name[locale] ?? id,
              ),
            }}
          />
          {data.about && <p className="font-sans text-label whitespace-pre-wrap">{data.about}</p>}
        </div>
      )}
    </QueryView>
  )
}

/** "ECMR 6.25% 29", a chart's title, a publication's or a news headline: what a message shared. */
const sharedLabel = (shared: SharedObjectDto) =>
  shared.type === 'security'
    ? shared.code
    : shared.type === 'chart'
      ? shared.chart.title
      : shared.type === 'news'
        ? shared.headline
        : shared.title

/**
 * A reported conversation, read when the Admin asks only (spec section 15): each reading is
 * written to the audit log. Its messages as the members read them, a deleted one deleted.
 */
export function ReportedConversation({ item }: { item: ReportedItemDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const [reading, setReading] = useState(false)
  const conversation = useReportedConversation(reading ? item.id : null)
  return (
    <section className="flex flex-col gap-2 font-sans text-data">
      <h3 className={SECTION_TITLE}>{t('directoryReports.messages')}</h3>
      <p className="text-secondary">
        {item.conversation?.kind === 'group'
          ? t('directoryReports.group', { count: item.conversation.memberCount })
          : t('directoryReports.direct')}
      </p>
      {!reading ? (
        <>
          <p role="note">{t('directoryReports.readNote')}</p>
          <Button variant="info" className="self-start" onClick={() => setReading(true)}>
            {t('directoryReports.read')}
          </Button>
        </>
      ) : (
        <QueryView query={conversation}>
          {(data) => (
            <>
              <p role="status" className="text-secondary">
                {t('directoryReports.readLogged')}
              </p>
              <p>
                {data.members.map((member, index) => (
                  <span key={member.userId}>
                    {index > 0 && ' · '}
                    {member.displayName} (<AccountTypeText type={member.accountType} short />)
                    {member.left && ` ${t('directoryReports.left')}`}
                  </span>
                ))}
              </p>
              <ol aria-label={t('directoryReports.messages')} className="flex flex-col gap-2">
                {data.messages.map((message) => (
                  <li key={message.id} className="flex flex-col gap-0.5 border-l-2 pl-2">
                    <span className="text-secondary">
                      <span className="font-semibold text-primary">
                        {message.author.displayName}
                      </span>{' '}
                      · {format.date(message.sentAt)} {format.time(message.sentAt)}
                      {message.editedAt && ` · ${t('messaging.thread.edited')}`}
                    </span>
                    <p className="text-label whitespace-pre-wrap">
                      {message.deleted ? (
                        <em className="text-secondary">{t('messaging.thread.deleted')}</em>
                      ) : (
                        message.text
                      )}
                    </p>
                    {message.attachments.length > 0 && (
                      <p className="text-secondary">
                        {t('directoryReports.files', {
                          names: message.attachments.map((file) => file.fileName).join(', '),
                        })}
                      </p>
                    )}
                    {message.shared && (
                      <p className="text-secondary">
                        {t('directoryReports.shared', { label: sharedLabel(message.shared) })}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </>
          )}
        </QueryView>
      )}
    </section>
  )
}

/**
 * The account the reports are about, with the actions of USER: Change type, Reset two-factor
 * authentication, View audit log, Suspend, which closes its reports.
 */
export function ReportedAccount({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const account = useAccount(userId)
  return (
    <section className="flex flex-col gap-2 font-sans text-data">
      <h3 className={SECTION_TITLE}>{t('directoryReports.account')}</h3>
      <QueryView query={account}>
        {(data) => (
          <>
            <p className="flex flex-wrap items-center gap-x-2">
              <span className="text-label font-semibold">{data.displayName}</span>
              <AccountTypeText type={data.accountType} />
              <AccountStatusText account={data} />
            </p>
            {data.status === 'suspended' && (
              <p role="note" className="text-down">
                {t('directoryReports.suspended')}
              </p>
            )}
            <AccountActions account={data} />
            <ButtonLink to={adminUserPath(userId)} variant="info" className="self-start">
              {t('directoryReports.openAccount')}
            </ButtonLink>
          </>
        )}
      </QueryView>
    </section>
  )
}
