import type { TFunction } from 'i18next'
import { ListPlus, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { LiveChange, LiveChangePct, LivePrice, LiveVolume, priceDecimals } from '@/entities/quote'
import { openWatchlistDialog, useWatchlists, WATCHLIST_COLUMNS } from '@/entities/watchlist'
import {
  AddToWatchlistBox,
  useWatchlistItemMenu,
  WatchlistMenu,
} from '@/features/manage-watchlists'
import { useSecurityMenu } from '@/features/security-actions'
import type { WatchlistColumn, WatchlistDto, WatchlistItemDto } from '@/shared/api/contracts'
import { useSymbolSubscription } from '@/shared/realtime'
import { securityPath } from '@/shared/routes/paths'
import { createDataColumnHelper, type DataColumns } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { Sparkline } from '@/shared/ui/Sparkline'

const helper = createDataColumnHelper<WatchlistItemDto>()
const NO_LISTS: WatchlistDto[] = []
const NO_COLUMNS: DataColumns<WatchlistItemDto> = []
const getItemId = (item: WatchlistItemDto) => item.securityId
const decimalsOf = (item: WatchlistItemDto) => priceDecimals(item.type, item.currency)

function buildColumns(
  t: TFunction,
  visible: readonly WatchlistColumn[],
): DataColumns<WatchlistItemDto> {
  const optional: Record<WatchlistColumn, DataColumns<WatchlistItemDto>[number]> = {
    name: helper.accessor('name', {
      header: t('columns.name'),
      meta: { width: '1.5fr' },
      cell: ({ row }) => <span className="font-sans text-secondary">{row.original.name}</span>,
    }),
    last: helper.accessor('last', {
      header: t('columns.last'),
      meta: { align: 'right' },
      cell: ({ row }) => (
        <LivePrice
          symbol={row.original.securityId}
          value={row.original.last}
          decimals={decimalsOf(row.original)}
          isDelayed={row.original.isDelayed}
        />
      ),
    }),
    change: helper.accessor('change', {
      header: t('columns.change'),
      meta: { align: 'right' },
      cell: ({ row }) => (
        <LiveChange
          symbol={row.original.securityId}
          value={row.original.change}
          decimals={decimalsOf(row.original)}
        />
      ),
    }),
    changePct: helper.accessor('changePct', {
      header: t('columns.changePct'),
      meta: { align: 'right' },
      cell: ({ row }) => (
        <LiveChangePct symbol={row.original.securityId} value={row.original.changePct} />
      ),
    }),
    volume: helper.accessor('volume', {
      header: t('columns.volume'),
      meta: { align: 'right' },
      cell: ({ row }) => (
        <LiveVolume symbol={row.original.securityId} value={row.original.volume} />
      ),
    }),
    sparkline: helper.display({
      id: 'sparkline',
      header: t('columns.fiveDays'),
      meta: { width: '84px', exportable: false },
      cell: ({ row }) => <Sparkline values={row.original.sparkline} />,
    }),
  }
  return [
    helper.accessor('code', {
      header: t('columns.security'),
      meta: { width: '1.4fr' },
      cell: ({ row }) => <span className="text-accent-amber">{row.original.code}</span>,
    }),
    ...WATCHLIST_COLUMNS.filter((column) => visible.includes(column)).map(
      (column) => optional[column],
    ),
  ]
}

/**
 * Screen 1, Watchlist: one tab per list, columns chosen per list, 5-day sparkline, real-time
 * quotes. "+ Add" adds securities, "…" creates, edits or deletes a list (spec section 2).
 */
export function WatchlistPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const securityMenu = useSecurityMenu()
  const watchlists = useWatchlists()
  const lists = watchlists.data ?? NO_LISTS
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  // Each list has its own columns; building them per list keeps every column array stable.
  const columnsByList = useMemo(
    () => new Map(lists.map((list) => [list.id, buildColumns(t, list.columns)])),
    [t, lists],
  )
  const active = lists.find((list) => list.id === activeId) ?? lists.at(0)
  const columns = (active && columnsByList.get(active.id)) ?? NO_COLUMNS
  const itemMenu = useWatchlistItemMenu(active)
  useSymbolSubscription(active?.items.map((item) => item.securityId) ?? [])

  const tabs = lists.map((list) => ({ value: list.id, label: list.code }))
  const selectList = (id: string) => {
    setActiveId(id)
    setSelectedId(null)
  }

  return (
    <Panel
      title={t('panels.watchlist', { name: active?.name ?? '' })}
      options={
        <>
          {active && (
            <button
              type="button"
              aria-pressed={adding}
              onClick={() => setAdding(!adding)}
              className="panel-no-drag inline-flex items-center gap-1 uppercase hover:text-primary"
            >
              <Plus aria-hidden className="size-3" />
              {t('market.add')}
            </button>
          )}
          {lists.length > 1 && active && (
            <PanelTabs value={active.id} options={tabs} onChange={selectList} />
          )}
          <WatchlistMenu list={active} onCreated={(list) => selectList(list.id)} />
        </>
      }
      // A single list shows its code where the panels show their function code (mockup).
      code={lists.length === 1 ? active?.code : undefined}
      bodyClassName="flex flex-col"
    >
      {adding && active && <AddToWatchlistBox list={active} onClose={() => setAdding(false)} />}
      <div className="min-h-0 flex-1">
        <QueryView query={watchlists}>
          {() =>
            active ? (
              <DataTable
                data={active.items}
                columns={columns}
                getRowId={getItemId}
                selectedRowId={selectedId}
                onRowClick={(item) => setSelectedId(item.securityId)}
                onRowDoubleClick={(item) => void navigate(securityPath(item.securityId))}
                rowMenu={(item) => [
                  ...securityMenu({ id: item.securityId, code: item.code }),
                  ...itemMenu(item),
                ]}
                exportName={`watchlist-${active.code}`}
                emptyMessage={t('watchlists.emptyList')}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-2">
                <span className="font-sans text-data text-secondary">{t('watchlists.noList')}</span>
                <Button
                  size="sm"
                  icon={ListPlus}
                  onClick={() => openWatchlistDialog({ mode: 'create' })}
                >
                  {t('watchlists.newList')}
                </Button>
              </div>
            )
          }
        </QueryView>
      </div>
    </Panel>
  )
}
