import type { TFunction } from 'i18next'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { LiveChangePct, LivePrice, LiveVolume, priceDecimals } from '@/entities/quote'
import { useWatchlists } from '@/entities/watchlist'
import { useSecurityMenu } from '@/features/security-actions'
import type { WatchlistColumn, WatchlistDto, WatchlistItemDto } from '@/shared/api/contracts'
import { useSymbolSubscription } from '@/shared/realtime'
import { securityPath } from '@/shared/routes/paths'
import { createDataColumnHelper, type DataColumns } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { Sparkline } from '@/shared/ui/Sparkline'

const helper = createDataColumnHelper<WatchlistItemDto>()
const COLUMN_ORDER: readonly WatchlistColumn[] = ['last', 'changePct', 'volume', 'sparkline']
const NO_LISTS: WatchlistDto[] = []
const NO_COLUMNS: DataColumns<WatchlistItemDto> = []
const getItemId = (item: WatchlistItemDto) => item.securityId

function buildColumns(
  t: TFunction,
  visible: readonly WatchlistColumn[],
): DataColumns<WatchlistItemDto> {
  const optional = {
    last: helper.accessor('last', {
      header: t('columns.last'),
      meta: { align: 'right' },
      cell: ({ row }) => (
        <LivePrice
          symbol={row.original.securityId}
          value={row.original.last}
          decimals={priceDecimals(row.original.type, row.original.currency)}
          isDelayed={row.original.isDelayed}
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
    ...COLUMN_ORDER.filter((column) => visible.includes(column)).map((column) => optional[column]),
  ]
}

/** Screen 1, Watchlist: one tab per list, configurable columns, 5-day sparkline, real-time quotes. */
export function WatchlistPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const securityMenu = useSecurityMenu()
  const watchlists = useWatchlists()
  const lists = watchlists.data ?? NO_LISTS
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Each list has its own columns; building them per list keeps every column array stable.
  const columnsByList = useMemo(
    () => new Map(lists.map((list) => [list.id, buildColumns(t, list.columns)])),
    [t, lists],
  )
  const active = lists.find((list) => list.id === activeId) ?? lists.at(0)
  const columns = (active && columnsByList.get(active.id)) ?? NO_COLUMNS
  useSymbolSubscription(active?.items.map((item) => item.securityId) ?? [])

  const tabs = lists.map((list) => ({ value: list.id, label: list.code }))

  return (
    <Panel
      title={t('panels.watchlist', { name: active?.name ?? '' })}
      options={
        <>
          {lists.length > 1 && active && (
            <PanelTabs value={active.id} options={tabs} onChange={setActiveId} />
          )}
          {/* Editing lists comes with the watchlist editor. */}
          <button
            type="button"
            disabled
            className="panel-no-drag inline-flex items-center gap-1 uppercase"
          >
            <Plus aria-hidden className="size-3" />
            {t('market.add')}
          </button>
        </>
      }
    >
      <QueryView query={watchlists} isEmpty={(data) => data.length === 0}>
        {() =>
          active && (
            <DataTable
              data={active.items}
              columns={columns}
              getRowId={getItemId}
              selectedRowId={selectedId}
              onRowClick={(item) => setSelectedId(item.securityId)}
              onRowDoubleClick={(item) => void navigate(securityPath(item.securityId))}
              rowMenu={(item) => securityMenu(item.securityId)}
              exportName={`watchlist-${active.code}`}
            />
          )
        }
      </QueryView>
    </Panel>
  )
}
