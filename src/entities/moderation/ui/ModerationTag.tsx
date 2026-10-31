import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { ModerationItemDto } from '@/shared/api/contracts'

/**
 * Report or Pending, as in the screen 9 mockup: a report of a conflict of interest or of copied
 * content in red, another report in amber, a publication waiting in blue.
 */
export function ModerationTag({ item }: { item: Pick<ModerationItemDto, 'kind' | 'reports'> }) {
  const { t } = useTranslation()
  const serious = item.reports.some(
    (report) => report.reason === 'conflict' || report.reason === 'copyright',
  )
  return (
    <span
      className={clsx(
        'inline-block w-24 shrink-0 border px-1.5 font-sans text-data font-semibold',
        item.kind === 'pending'
          ? 'border-info text-info'
          : serious
            ? 'border-down text-down'
            : 'border-accent-amber bg-accent-amber text-app',
      )}
    >
      {t(`moderation.kinds.${item.kind}`)}
    </span>
  )
}
