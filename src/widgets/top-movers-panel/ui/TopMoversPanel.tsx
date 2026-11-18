import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useMarketMovers } from '@/entities/market'
import {
  LiveChangePct,
  LivePrice,
  LiveVolume,
  priceDecimals,
  useLiveQuoteRows,
  type LiveQuote,
} from '@/entities/quote'
import { useSecurityMenu } from '@/features/security-actions'
import type { MoverDto, MoversType } from '@/shared/api/contracts'
import { useSymbolSubscription } from '@/shared/realtime'
import { securityPath } from '@/shared/routes/paths'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<MoverDto>()
const MOVERS_TYPES: readonly MoversType[] = ['gainers', 'losers', 'volume']
const getMoverId = (mover: MoverDto) => mover.securityId
/** A mover as its live cells show it: the table sorts on that (B42). */
const liveMover = (mover: MoverDto, quote: LiveQuote): MoverDto => ({
  ...mover,
  last: quote.last,
  changePct: quote.changePct,
  volume: quote.volume,
})

/** Screen 1, Top movers: tabs Gainers / Losers / Volume. API /market/movers. */
export function TopMoversPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const securityMenu = useSecurityMenu()
  const [type, setType] = useState<MoversType>('gainers')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const movers = useMarketMovers(type)
  useSymbolSubscription(movers.data?.map((mover) => mover.securityId) ?? [])
  const rows = useLiveQuoteRows(movers.data, getMoverId, liveMover)

  const tabs = useMemo(
    () => MOVERS_TYPES.map((value) => ({ value, label: t(`market.movers.${value}`) })),
    [t],
  )
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('code', {
          header: t('columns.security'),
          meta: { width: '1.3fr' },
          cell: ({ row }) => <span className="text-accent-amber">{row.original.code}</span>,
        }),
        helper.accessor('last', {
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
        helper.accessor('changePct', {
          header: t('columns.changePct'),
          meta: { align: 'right' },
          cell: ({ row }) => (
            <LiveChangePct symbol={row.original.securityId} value={row.original.changePct} />
          ),
        }),
        helper.accessor('volume', {
          header: t('columns.volumeShares'),
          meta: { align: 'right' },
          cell: ({ row }) => (
            <LiveVolume symbol={row.original.securityId} value={row.original.volume} />
          ),
        }),
      ]),
    [t],
  )

  return (
    <Panel
      title={t('panels.topMovers')}
      code="MKT"
      options={<PanelTabs value={type} options={tabs} onChange={setType} />}
    >
      <QueryView query={movers}>
        {() => (
          <DataTable
            data={rows}
            columns={columns}
            getRowId={getMoverId}
            selectedRowId={selectedId ?? rows.at(0)?.securityId}
            onRowClick={(mover) => setSelectedId(mover.securityId)}
            onRowDoubleClick={(mover) => void navigate(securityPath(mover.securityId))}
            rowMenu={(mover) => securityMenu({ id: mover.securityId, code: mover.code })}
            exportName={`top-movers-${type}`}
          />
        )}
      </QueryView>
    </Panel>
  )
}
