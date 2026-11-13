import { useTranslation } from 'react-i18next'
import { formatMacroFigure, useMacroNames, useMacroSummary } from '@/entities/macro'
import type { MacroTileDto } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import { QueryView } from '@/shared/ui/QueryView'
import { Sparkline } from '@/shared/ui/Sparkline'

/**
 * Screen 25's six key indicator tiles (spec section 9), the Admin's: the latest figure, its year
 * and its seven years; "n/a" for a series not published, or not for ten years; the source when a
 * Data admin's file gave the figure. API /macro/countries/{iso3}/summary.
 */
export function KeyIndicatorTiles({ country }: { country: string | undefined }) {
  const { t } = useTranslation()
  const summary = useMacroSummary(country)

  return (
    <section aria-label={t('eco.tiles')}>
      <QueryView query={summary} isEmpty={(data) => data.tiles.length === 0}>
        {(data) => (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {data.tiles.map((tile) => (
              <Tile key={tile.indicator} tile={tile} />
            ))}
          </ul>
        )}
      </QueryView>
    </section>
  )
}

function Tile({ tile }: { tile: MacroTileDto }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const names = useMacroNames()
  const latest = tile.current ? tile.latest : null
  const publisher = latest && latest.publisher !== 'worldBank' ? latest.publisher : null

  return (
    <li className="flex min-h-24 flex-col gap-1 border bg-panel px-3 py-2">
      <h3
        title={names.name(tile)}
        className="line-clamp-2 font-sans text-label font-semibold tracking-wide text-secondary uppercase"
      >
        {names.name(tile)}
      </h3>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <p
          className={
            latest
              ? 'font-mono text-figure font-semibold text-primary tabular-nums'
              : 'font-mono text-figure font-semibold text-secondary'
          }
        >
          {latest
            ? formatMacroFigure(latest.value, tile.unit, locale, 'tile')
            : t('eco.notAvailable')}
        </p>
        {latest && tile.history.length > 1 && (
          <Sparkline values={tile.history.map((year) => year.value)} width={96} height={28} />
        )}
      </div>
      <p className="flex justify-between gap-2 font-sans text-label text-secondary">
        <span className="font-mono">{latest ? latest.year : '–'}</span>
        <span className="truncate" title={latest?.comment ?? undefined}>
          {publisher
            ? t('eco.source', { source: t(`eco.publishers.${publisher}`) })
            : !latest &&
              (tile.latest ? t('eco.notSince', { year: tile.latest.year }) : t('eco.notPublished'))}
        </span>
      </p>
    </li>
  )
}
