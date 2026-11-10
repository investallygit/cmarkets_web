import { clsx } from 'clsx'
import { BadgeCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { NewsItemSourceDto, NewsSourceDto, NewsType } from '@/shared/api/contracts'
import { newsFilterPath } from '@/shared/routes/paths'
import { HoverCard } from '@/shared/ui/HoverCard'
import { CHANNEL_TAG, TYPE_TAG } from '../config/tags'
import { displayUrl, initials } from '../lib/sourceText'

/** 18 px high, Inter 10.5 px bold, 1 px border, the colour at 15% (spec section 16). */
const TAG =
  'news-tag inline-flex h-4.5 shrink-0 items-center border px-1 font-sans text-tag font-bold uppercase'

/**
 * How a tag reacts: a link to the N screen filtered on it, in the tab order ("tab") or for the
 * pointer only ("pointer": a list's rows, whose filters the N screen's bar offers from the
 * keyboard); "none" where it sits in another control (a card, a table row).
 */
export type NewsTagMode = 'tab' | 'pointer' | 'none'

interface TagProps {
  mode?: NewsTagMode
  className?: string
}

/** FLASH in red, ARTICLE in blue; a click filters the feed on the type. */
export function NewsTypeTag({ type, mode = 'tab', className }: TagProps & { type: NewsType }) {
  const { t } = useTranslation()
  const label = t(`news.types.${type}`)
  const classes = clsx(TAG, TYPE_TAG[type], className)
  if (mode === 'none') return <span className={classes}>{label}</span>
  return (
    <Link
      to={newsFilterPath({ type })}
      tabIndex={mode === 'pointer' ? -1 : undefined}
      aria-label={t('news.filterType', { type: label })}
      className={clsx(classes, 'hover:underline')}
    >
      {label}
    </Link>
  )
}

/**
 * The newspaper's short name, coloured by channel; on hover or focus, its name, logo, channel and
 * the original link. A click filters the feed on the newspaper.
 */
export function NewsSourceTag({
  source,
  mode = 'tab',
  className,
}: TagProps & { source: NewsSourceDto | NewsItemSourceDto }) {
  const { t } = useTranslation()
  const classes = clsx(TAG, CHANNEL_TAG[source.channel], className)
  return (
    <HoverCard content={<SourceCard source={source} />}>
      {(describedBy) =>
        mode === 'none' ? (
          <span className={classes}>{source.shortName}</span>
        ) : (
          <Link
            to={newsFilterPath({ source: source.id })}
            tabIndex={mode === 'pointer' ? -1 : undefined}
            aria-label={t('news.filterSource', { name: source.shortName })}
            aria-describedby={describedBy}
            className={clsx(classes, 'hover:underline')}
          >
            {source.shortName}
          </Link>
        )
      }
    </HoverCard>
  )
}

/** Both tags, after the time and before the subject, wherever an item appears. */
export function NewsTags({
  type,
  source,
  mode,
}: {
  type: NewsType
  source: NewsSourceDto | NewsItemSourceDto
  mode?: NewsTagMode
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      <NewsTypeTag type={type} mode={mode} />
      <NewsSourceTag source={source} mode={mode} />
    </span>
  )
}

/** The newspaper's card: logo (or its initials), name, channel, the original article. */
function SourceCard({ source }: { source: NewsSourceDto | NewsItemSourceDto }) {
  const { t } = useTranslation()
  const original = 'originalUrl' in source ? source.originalUrl : null
  return (
    <span className="flex items-start gap-2">
      {source.logoUrl ? (
        <img src={source.logoUrl} alt="" className="size-8 shrink-0 object-contain" />
      ) : (
        <span
          aria-hidden
          className={clsx(TAG, CHANNEL_TAG[source.channel], 'size-8 justify-center text-data')}
        >
          {initials(source.name)}
        </span>
      )}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 font-semibold text-primary">
          {source.name}
          {source.verified && (
            <BadgeCheck aria-label={t('news.verified')} className="size-3.5 shrink-0 text-up" />
          )}
        </span>
        <span className="text-secondary">{t(`news.channels.${source.channel}`)}</span>
        {original && <span className="break-all text-info">{displayUrl(original)}</span>}
      </span>
    </span>
  )
}
