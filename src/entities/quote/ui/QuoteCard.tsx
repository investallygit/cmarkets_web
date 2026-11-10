import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { securityPath } from '@/shared/routes/paths'
import { useQuote } from '../api/queries'
import { LiveChangePct, LivePrice } from './LiveQuote'

interface QuoteCardProps {
  securityId: string
  /** The display code, "ECMR 6.25% 29"; the id stands in without it. */
  code: string | null
  /** In the reader, the card opens the security's profile; not while it is edited. */
  linked?: boolean
}

/**
 * "CMarket security" card of a news item (spec section 16): RELATED · the code, then the name,
 * the live price and the day's change, as the screen 13 mockup frames it.
 */
export function QuoteCard({ securityId, code, linked = true }: QuoteCardProps) {
  const { t } = useTranslation()
  const quote = useQuote(securityId)
  const label = code ?? securityId
  const title = (
    <span className="font-mono text-title font-semibold tracking-wide text-accent-amber uppercase">
      {t('newsStudio.card.related')} · {label}
    </span>
  )
  return (
    <aside
      aria-label={t('newsStudio.card.label', { code: label })}
      className="my-2 flex flex-col gap-1 border border-accent-amber/70 px-3 py-2 not-italic"
    >
      {linked ? (
        <Link to={securityPath(securityId)} className="self-start hover:underline">
          {title}
        </Link>
      ) : (
        title
      )}
      {quote.data ? (
        <span className="flex flex-wrap items-baseline gap-x-2 font-mono text-data">
          <span className="font-sans">{quote.data.name}</span>
          <span>·</span>
          <LivePrice
            symbol={securityId}
            value={quote.data.last}
            // An equity in XAF has no decimals; a bond, quoted in % of its par, two.
            decimals={quote.data.currency === 'XAF' && Number.isInteger(quote.data.last) ? 0 : 2}
            isDelayed={quote.data.isDelayed}
          />
          <span className="text-secondary">{quote.data.currency}</span>
          <LiveChangePct symbol={securityId} value={quote.data.changePct} />
        </span>
      ) : (
        <span className="font-mono text-data text-secondary">
          {quote.isError ? t('newsStudio.card.unavailable') : '…'}
        </span>
      )}
    </aside>
  )
}
