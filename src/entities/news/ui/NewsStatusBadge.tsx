import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { ProviderNewsStatus } from '@/shared/api/contracts'
import { STATUS_TAG } from '../config/tags'

/** DRAFT, SCHEDULED, PUBLISHED or WITHDRAWN, in a box shaped as the tags (screen 13). */
export function NewsStatusBadge({ status }: { status: ProviderNewsStatus }) {
  const { t } = useTranslation()
  return (
    <span
      className={clsx(
        'news-tag inline-flex h-4.5 shrink-0 items-center border px-1 font-sans text-tag font-bold uppercase',
        STATUS_TAG[status],
      )}
    >
      {t(`newsStudio.statuses.${status}`)}
    </span>
  )
}
