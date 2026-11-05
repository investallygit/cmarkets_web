import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { ReportedItemDto } from '@/shared/api/contracts'

const TAG = 'inline-block w-24 shrink-0 border px-1.5 font-sans text-data font-semibold'

/** Profile in blue, Conversation in amber, then Referred in red past the Admin's threshold. */
export function ReportTags({ item }: { item: Pick<ReportedItemDto, 'type' | 'account'> }) {
  const { t } = useTranslation()
  return (
    <span className="flex flex-wrap gap-1.5">
      <span
        className={clsx(
          TAG,
          item.type === 'profile'
            ? 'border-info text-info'
            : 'border-accent-amber text-accent-amber',
        )}
      >
        {t(`directoryReports.tags.${item.type}`)}
      </span>
      {item.account?.referred && (
        <span className={clsx(TAG, 'border-down text-down')}>
          {t('directoryReports.tags.referred')}
        </span>
      )}
    </span>
  )
}
