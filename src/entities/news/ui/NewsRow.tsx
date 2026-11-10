import { clsx } from 'clsx'
import { Link, type To } from 'react-router'
import type { NewsItemDto } from '@/shared/api/contracts'
import { NewsTags } from './NewsTags'
import { NewsTime } from './NewsTime'

interface NewsRowProps {
  item: NewsItemDto
  /** The item's address: its content opens there. */
  to: To
  /** Replaces the current entry of the history, as the N screen's filters do. */
  replace?: boolean
  selected?: boolean
}

/**
 * A news item in a list (spec sections 9 and 16, screen 1): the time, the type and newspaper
 * tags, the subject in amber, the headline. The headline is the row's link, stretched over it;
 * the tags above it filter the N screen with the pointer (its filter bar does from the keyboard).
 */
export function NewsRow({ item, to, replace, selected = false }: NewsRowProps) {
  return (
    <div
      className={clsx(
        'relative grid grid-cols-[48px_minmax(0,1fr)] gap-x-2 px-2 py-1.5',
        selected ? 'bg-selected' : 'hover:bg-panel-header',
      )}
    >
      <span className="font-mono text-data text-secondary">
        <NewsTime publishedAt={item.publishedAt} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="relative z-10">
            <NewsTags type={item.type} source={item.source} mode="pointer" />
          </span>
          {item.subject && (
            <span className="truncate font-mono text-title font-semibold text-accent-amber">
              {item.subject}
            </span>
          )}
        </span>
        <Link
          to={to}
          replace={replace}
          aria-current={selected || undefined}
          className="block truncate font-sans text-label after:absolute after:inset-0"
        >
          {item.headline}
        </Link>
      </span>
    </div>
  )
}
