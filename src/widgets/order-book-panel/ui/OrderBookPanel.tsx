import { useTranslation } from 'react-i18next'
import { priceDecimals } from '@/entities/quote'
import { useOrderBook } from '@/entities/security'
import { useCurrentUser } from '@/entities/session'
import type { CurrencyCode, OrderBookDto, SecurityType } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

interface OrderBookPanelProps {
  securityId: string
  securityType: SecurityType
  currency: CurrencyCode
}

/**
 * Screen 2, order book: best 5 limits, with the quantity of each limit as a depth bar behind it,
 * green for bids and red for asks. API /securities/{id}/orderbook, polled.
 */
export function OrderBookPanel({ securityId, securityType, currency }: OrderBookPanelProps) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const allowed = user.permissions.includes('market:orderbook')
  const book = useOrderBook(securityId, allowed)

  return (
    <Panel
      title={t('panels.orderBook')}
      code="DES"
      options={<span>{t('orderBook.bestLimits')}</span>}
    >
      {allowed ? (
        <QueryView query={book}>
          {(data) => (
            <OrderBookTable book={data} decimals={priceDecimals(securityType, currency)} />
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

function DepthBar({ share, side }: { share: number; side: 'bid' | 'ask' }) {
  return (
    <span
      aria-hidden
      className={
        side === 'bid'
          ? 'absolute inset-y-0.5 right-0 bg-up/25'
          : 'absolute inset-y-0.5 left-0 bg-down/25'
      }
      style={{ width: `${Math.round(share * 100)}%` }}
    />
  )
}

function OrderBookTable({ book, decimals }: { book: OrderBookDto; decimals: number }) {
  const { t } = useTranslation()
  const format = useFormat()
  const largest = Math.max(1, ...[...book.bids, ...book.asks].map((level) => level.quantity))
  const depth = Math.max(book.bids.length, book.asks.length)
  const header = 'px-2 text-right font-sans font-normal text-secondary'

  return (
    <table className="w-full table-fixed font-mono text-data tabular-nums">
      <thead className="bg-panel-header">
        <tr className="h-row border-b">
          <th scope="col" className={header}>
            {t('orderBook.bidQty')}
          </th>
          <th scope="col" className={header}>
            {t('orderBook.bid')}
          </th>
          <th scope="col" className={header}>
            {t('orderBook.ask')}
          </th>
          <th scope="col" className={header}>
            {t('orderBook.askQty')}
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: depth }, (_, index) => {
          const bid = book.bids[index]
          const ask = book.asks[index]
          return (
            <tr key={index} className={index % 2 === 1 ? 'h-row bg-row-alt' : 'h-row'}>
              <td className="relative px-2 text-right">
                {bid && <DepthBar side="bid" share={bid.quantity / largest} />}
                <span className="relative">{bid && format.number(bid.quantity, 0)}</span>
              </td>
              <td className="px-2 text-right text-up">
                {bid && format.number(bid.price, decimals)}
              </td>
              <td className="px-2 text-right text-down">
                {ask && format.number(ask.price, decimals)}
              </td>
              <td className="relative px-2 text-right">
                {ask && <DepthBar side="ask" share={ask.quantity / largest} />}
                <span className="relative">{ask && format.number(ask.quantity, 0)}</span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
