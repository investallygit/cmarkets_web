import { useTranslation } from 'react-i18next'
import { AccountTypeBadge, useBlocks } from '@/entities/profile'
import { useFormat } from '@/shared/i18n'
import { BlockButton } from './BlockButton'

/** NET ME: the people the user blocked, each to unblock (spec sections 10 and 15). */
export function BlockedList() {
  const { t } = useTranslation()
  const format = useFormat()
  const blocks = useBlocks()
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-sans text-title font-semibold tracking-title text-accent-amber uppercase">
        {t('messaging.blocked.title')}
      </h3>
      <p className="font-sans text-title text-secondary">{t('messaging.blocked.hint')}</p>
      {blocks.data?.length === 0 && (
        <p className="font-sans text-data text-secondary">{t('messaging.blocked.none')}</p>
      )}
      <ul className="flex flex-col gap-1.5">
        {blocks.data?.map((person) => (
          <li key={person.userId} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-sans text-label">
              {person.displayName}
              <span className="ml-2 font-mono text-title text-secondary">
                {t('messaging.blocked.since', { date: format.date(person.blockedAt) })}
              </span>
            </span>
            <AccountTypeBadge type={person.accountType} />
            <BlockButton
              userId={person.userId}
              displayName={person.displayName}
              blocked
              size="md"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
