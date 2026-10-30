import { clsx } from 'clsx'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { priceDecimals } from '@/entities/quote'
import { useTrades } from '@/entities/security'
import { useCurrentUser } from '@/entities/session'
import type { CurrencyCode, SecurityType, TradeDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { TREND_TEXT, trendOf, type TrendDirection } from '@/shared/ui/trend'

interface TradeRow extends TradeDto {
  /** Compared with the trade before: an uptick is green, a downtick red. */
  tick: TrendDirection
}

interface LatestTradesPanelProps {
  securityId: string
  securityType: SecurityType
  currency: CurrencyCode
}

const helper = createDataColumnHelper<TradeRow>()

/** Screen 2, latest trades of the session, newest first. API /securities/{id}/trades, polled. */
export function LatestTradesPanel({ securityId, securityType, currency }: LatestTradesPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const user = useCurrentUser()
  const allowed = user.permissions.includes('market:orderbook')
  const trades = useTrades(securityId, allowed)
  const decimals = priceDecimals(securityType, currency)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('time', {
          header: t('columns.time'),
          cell: ({ getValue }) => format.time(getValue(), true),
        }),
        helper.accessor('price', {
          header: t('columns.price'),
          meta: { align: 'right' },
          cell: ({ getValue, row }) => (
            <span className={clsx(TREND_TEXT[row.original.tick])}>
              {format.number(getValue(), decimals)}
            </span>
          ),
        }),
        helper.accessor('quantity', {
          header: t('columns.quantity'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
      ]),
    [t, format, decimals],
  )

  return (
    <Panel title={t('panels.latestTrades')} code="DES">
      {allowed ? (
        <QueryView query={trades}>
          {(data) => (
            <DataTable
              data={data.map((trade, index) => ({
                ...trade,
                tick: trendOf(trade.price - (data[index + 1]?.price ?? trade.price)),
              }))}
              columns={columns}
              getRowId={(trade) => `${trade.time}-${trade.price}-${trade.quantity}`}
              enableSorting={false}
              exportName={`trades-${securityId}`}
            />
          )}
        </QueryView>
      ) : (
        <PanelEmpty
          message={t('orderBook.notIncluded', { type: t(`accountTypes.${user.accountType}`) })}
        />
      )}
    </Panel>
  )
}
