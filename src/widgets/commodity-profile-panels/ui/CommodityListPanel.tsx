import { clsx } from 'clsx'
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  commodityDecimals,
  FrequencyBadge,
  useCommodities,
  useCommodityNames,
  usePrefetchCommodity,
} from '@/entities/commodity'
import { useSecurityMenu } from '@/features/security-actions'
import type { CommodityCategory, CommodityListItemDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { securityPath } from '@/shared/routes/paths'
import { ChangeText } from '@/shared/ui/ChangeText'
import { ContextMenu } from '@/shared/ui/ContextMenu'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const CATEGORIES: readonly CommodityCategory[] = [
  'energy',
  'metals',
  'agriculture',
  'indices',
  'cemacComplement',
]

/** The pointer rests on a line before its series loads: moving across the list asks for nothing. */
const INTENT_MS = 100

interface OpenMenu {
  x: number
  y: number
  item: CommodityListItemDto
}

/**
 * Screen 21, the list on the left (spec section 9): the series by category, each with its short
 * name, its last value (in yellow, its date on hover, when older than its series allows), its
 * change since the value before and its frequency's badge; a click opens its profile, a right
 * click (or the menu key) adds it to a list or sets an alert on it. API /commodities.
 */
export function CommodityListPanel({ selected }: { selected: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const names = useCommodityNames()
  const commodities = useCommodities()
  const securityMenu = useSecurityMenu()
  const [menu, setMenu] = useState<OpenMenu | null>(null)

  // A line pointed at or focused loads its series ahead of the click.
  const today = useMarketDay()
  const prefetch = usePrefetchCommodity()
  const intent = useRef<number | undefined>(undefined)
  const cancelIntent = () => window.clearTimeout(intent.current)
  const startIntent = (item: CommodityListItemDto) => {
    cancelIntent()
    intent.current = window.setTimeout(() => prefetch(item, today), INTENT_MS)
  }
  useEffect(() => () => window.clearTimeout(intent.current), [])

  const openAt = (item: CommodityListItemDto, x: number, y: number) => setMenu({ x, y, item })
  const onContextMenu = (item: CommodityListItemDto) => (event: MouseEvent) => {
    event.preventDefault()
    openAt(item, event.clientX, event.clientY)
  }
  const onKeyDown = (item: CommodityListItemDto) => (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault()
      const box = event.currentTarget.getBoundingClientRect()
      openAt(item, box.left + 16, box.bottom)
    }
  }

  return (
    <Panel
      title={t('panels.commodityList')}
      code="CMDTY"
      options={
        commodities.data && (
          <span>{t('commodities.list.count', { count: commodities.data.length })}</span>
        )
      }
      bodyClassName="flex min-h-0 flex-col"
    >
      <QueryView query={commodities}>
        {(items) => (
          <nav aria-label={t('commodities.list.label')} className="min-h-0 flex-1 overflow-y-auto">
            {CATEGORIES.map((category) => {
              const rows = items.filter((item) => item.category === category)
              if (rows.length === 0) return null
              return (
                <section key={category} aria-labelledby={`commodity-group-${category}`}>
                  <h2
                    id={`commodity-group-${category}`}
                    className="sticky top-0 border-b bg-panel-header px-2 py-0.5 font-sans text-title font-semibold uppercase text-accent-amber"
                  >
                    {t(`commodities.categories.${category}`)}
                  </h2>
                  <ul>
                    {rows.map((item) => {
                      const current = item.code === selected
                      return (
                        <li key={item.code}>
                          <Link
                            to={securityPath(item.code)}
                            aria-current={current ? 'page' : undefined}
                            onPointerEnter={() => startIntent(item)}
                            onPointerLeave={cancelIntent}
                            onFocus={() => startIntent(item)}
                            onBlur={cancelIntent}
                            onContextMenu={onContextMenu(item)}
                            onKeyDown={onKeyDown(item)}
                            className={clsx(
                              'grid min-h-6 grid-cols-[minmax(0,1fr)_auto_4.5rem_auto] items-center gap-x-2 px-2 font-mono text-data',
                              current
                                ? 'bg-selected text-primary'
                                : 'hover:bg-selected/60 focus-visible:bg-selected/60',
                            )}
                          >
                            <span className="truncate font-sans">{names.name(item, true)}</span>
                            <span
                              className={clsx('text-right', item.stale && 'text-warning')}
                              title={
                                item.last
                                  ? t('commodities.list.asOf', {
                                      date: format.isoDate(item.last.date),
                                    })
                                  : undefined
                              }
                            >
                              {item.last
                                ? format.number(
                                    item.last.value,
                                    commodityDecimals(item.last.value, item.unit),
                                  )
                                : '—'}
                              {item.stale && (
                                <span className="sr-only">{t('commodities.stale')}</span>
                              )}
                            </span>
                            <span className="text-right">
                              {item.changePct === null ? (
                                <span className="text-secondary">—</span>
                              ) : (
                                <ChangeText value={item.changePct} percent />
                              )}
                            </span>
                            <FrequencyBadge frequency={item.frequency} />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </nav>
        )}
      </QueryView>
      <p className="shrink-0 border-t px-2 py-1 font-sans text-title text-secondary">
        {t('commodities.list.legend')}
      </p>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={securityMenu({ id: menu.item.code, code: menu.item.code })}
          onClose={() => setMenu(null)}
        />
      )}
    </Panel>
  )
}
