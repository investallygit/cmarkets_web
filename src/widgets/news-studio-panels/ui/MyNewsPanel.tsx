import { clsx } from 'clsx'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NewsStatusBadge, NewsTypeTag, useMyNews, useNewsClicks } from '@/entities/news'
import type { ProviderNewsRowDto, ProviderNewsStatus } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { addDays } from '@/shared/lib/isoDate'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'

type Tab = 'all' | ProviderNewsStatus

const TABS: readonly Tab[] = ['all', 'draft', 'scheduled', 'published', 'withdrawn']

interface MyNewsPanelProps {
  selectedId: string | null
  onSelect: (newsId: string) => void
  onCreate: () => void
}

/**
 * Screen 13, left: the newspaper's items by status (All, Drafts, Scheduled, Published, Withdrawn),
 * each with its status and type badges and its unique clicks, a scheduled one its time.
 * API GET /provider/news and /provider/news/stats.
 */
export function MyNewsPanel({ selectedId, onSelect, onCreate }: MyNewsPanelProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('all')
  const news = useMyNews({ status: tab === 'all' ? null : tab, type: null, pageSize: 200 })
  const clicks = useNewsClicks().data
  const byItem = new Map(clicks?.rows.map((row) => [row.key, row.payable]) ?? [])

  return (
    <Panel
      title={t('panels.myNews')}
      code="NEWS"
      options={
        <button
          type="button"
          onClick={onCreate}
          className="panel-no-drag uppercase hover:text-primary"
        >
          {t('newsStudio.mine.new')}
        </button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 justify-start overflow-x-auto border-b px-2 py-1 font-sans text-title">
          <PanelTabs
            value={tab}
            options={TABS.map((value) => ({ value, label: t(`newsStudio.tabs.${value}`) }))}
            onChange={setTab}
          />
        </div>
        <QueryView
          query={news}
          isEmpty={(page) => page.items.length === 0}
          emptyMessage={tab === 'all' ? t('newsStudio.mine.empty') : t('newsStudio.mine.emptyTab')}
        >
          {(page) => (
            <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
              {page.items.map((item) => (
                <li key={item.id}>
                  <NewsStudioRow
                    item={item}
                    clicks={byItem.get(item.id) ?? 0}
                    selected={item.id === selectedId}
                    onSelect={() => onSelect(item.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </QueryView>
      </div>
    </Panel>
  )
}

function NewsStudioRow({
  item,
  clicks,
  selected,
  onSelect,
}: {
  item: ProviderNewsRowDto
  clicks: number
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const today = useMarketDay()
  let trailing: string
  if (item.status === 'scheduled' && item.publishAt) {
    const day = format.day(item.publishAt)
    const time = format.time(item.publishAt)
    trailing =
      day === today
        ? t('newsStudio.mine.today', { time })
        : day === addDays(today, 1)
          ? t('newsStudio.mine.tomorrow', { time })
          : `${format.date(item.publishAt)} ${time}`
  } else if (item.status === 'withdrawn') trailing = t('newsStudio.mine.withdrawn')
  else if (item.status === 'published')
    trailing = t('newsStudio.mine.clicks', { count: clicks, formatted: format.number(clicks, 0) })
  else trailing = ''

  return (
    <button
      type="button"
      aria-current={selected || undefined}
      onClick={onSelect}
      className={clsx(
        'flex w-full flex-col gap-1.5 border-l-2 px-3 py-2 text-left',
        selected ? 'border-accent-amber bg-selected' : 'border-transparent hover:bg-panel-header',
      )}
    >
      <span className="line-clamp-2 font-sans text-label">
        {item.headline || t('newsStudio.mine.untitled')}
      </span>
      <span className="flex items-center gap-1.5">
        <NewsStatusBadge status={item.status} />
        <NewsTypeTag type={item.type} mode="none" />
        {trailing && <span className="ml-auto font-mono text-data text-secondary">{trailing}</span>}
      </span>
    </button>
  )
}
