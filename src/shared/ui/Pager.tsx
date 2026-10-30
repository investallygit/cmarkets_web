import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'

interface PagerProps {
  page: number
  pageSize: number
  totalCount: number
  onChange: (page: number) => void
}

/** Pages of a server list, `{ items, page, pageSize, totalCount }` (spec section 10). */
export function Pager({ page, pageSize, totalCount, onChange }: PagerProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const pages = Math.max(1, Math.ceil(totalCount / pageSize))
  if (pages <= 1) return null
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, totalCount)
  const button = 'flex size-5 items-center justify-center hover:text-primary disabled:opacity-40'

  return (
    <nav
      aria-label={t('pager.label')}
      className="flex h-row shrink-0 items-center justify-end gap-2 border-t px-2 font-mono text-data text-secondary"
    >
      <span>
        {t('pager.range', {
          first: format.number(first, 0),
          last: format.number(last, 0),
          total: format.number(totalCount, 0),
        })}
      </span>
      <button
        type="button"
        className={button}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label={t('pager.previous')}
      >
        <ChevronLeft aria-hidden className="size-3.5" />
      </button>
      <span aria-current="page">{t('pager.page', { page, pages })}</span>
      <button
        type="button"
        className={button}
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        aria-label={t('pager.next')}
      >
        <ChevronRight aria-hidden className="size-3.5" />
      </button>
    </nav>
  )
}
