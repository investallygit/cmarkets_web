import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useEtfHoldings, useEtfLabels } from '@/entities/etf'
import type { EtfHoldingsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { securityPath } from '@/shared/routes/paths'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { barWidths, holdingsRest } from '../lib/portfolio'
import { DASH } from './words'

/** The mockup's top holdings on DES. */
const TOP = 10

interface EtfHoldingsPanelProps {
  etfId: string
  /** DES's ten largest lines (the mockup's), or every line known (HLD). */
  variant: 'top' | 'all'
}

/**
 * Screen 19, holdings: each line's name, its weight as a bar and in percent, the number of lines
 * in all; a line CMarket lists opens its profile. HLD adds each line's sector and country, what the
 * lines listed leave out, the day and the source. API /etfs/{id}/holdings?top=10.
 */
export function EtfHoldingsPanel({ etfId, variant }: EtfHoldingsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const holdings = useEtfHoldings(etfId, variant === 'top' ? TOP : null)
  const total = holdings.data?.total ?? null
  return (
    <Panel
      title={variant === 'top' ? t('panels.etfTopHoldings') : t('panels.etfHoldings')}
      code="HLD"
      options={
        total !== null && (
          <span>
            {t('etfProfile.holdings.count', { count: total, value: format.number(total, 0) })}
          </span>
        )
      }
      bodyClassName="overflow-y-auto"
    >
      <QueryView query={holdings}>
        {(data) =>
          data.items.length === 0 ? (
            <p className="p-3 font-sans text-data text-secondary">
              {t('etfProfile.holdings.empty')}
            </p>
          ) : (
            <HoldingsTable data={data} full={variant === 'all'} />
          )
        }
      </QueryView>
    </Panel>
  )
}

function HoldingsTable({ data, full }: { data: EtfHoldingsDto; full: boolean }) {
  const { t } = useTranslation()
  const format = useFormat()
  const labels = useEtfLabels()
  const widths = barWidths(data.items)
  const rest = holdingsRest(data.items, data.total)
  const head = 'px-2 py-1 font-sans text-title font-normal text-secondary'
  // DES's ten lines fit the mockup's panel; HLD's leave the names their room.
  const cell = full ? 'px-2 py-1' : 'px-2 py-0.5'
  return (
    <div>
      <table className="w-full border-collapse">
        <thead className={full ? undefined : 'sr-only'}>
          <tr>
            {full && (
              <th scope="col" className={`${head} w-8 text-right`}>
                {t('etfProfile.holdings.rank')}
              </th>
            )}
            <th scope="col" className={`${head} text-left`}>
              {t('etfProfile.holdings.name')}
            </th>
            {full && (
              <>
                <th scope="col" className={`${head} w-[18%] text-left`}>
                  {t('etfProfile.holdings.sector')}
                </th>
                <th scope="col" className={`${head} w-[16%] text-left`}>
                  {t('etfProfile.holdings.country')}
                </th>
              </>
            )}
            <th scope="col" className={`${head} text-right`} colSpan={2}>
              {t('etfProfile.holdings.weight')}
            </th>
          </tr>
        </thead>
        <tbody className="font-sans text-label">
          {data.items.map((item, index) => (
            <tr key={item.rank} className="even:bg-panel-header/40">
              {full && (
                <td className={`${cell} text-right font-mono text-data text-secondary`}>
                  {item.rank}
                </td>
              )}
              <th scope="row" className={`${cell} max-w-0 truncate text-left font-normal`}>
                {item.securityId ? (
                  <Link
                    to={securityPath(item.securityId)}
                    title={t('etfProfile.holdings.listed')}
                    className="text-info underline-offset-2 hover:underline"
                  >
                    {item.name}
                  </Link>
                ) : (
                  item.name
                )}
              </th>
              {full && (
                <>
                  <td className={`${cell} truncate text-secondary`}>
                    {item.sector ? labels.holdingSector(item.sector) : DASH}
                  </td>
                  <td className={`${cell} truncate text-secondary`}>
                    {item.country ? format.country(item.country) : DASH}
                  </td>
                </>
              )}
              <td aria-hidden className={`${cell} ${full ? 'w-1/5' : 'w-2/5'}`}>
                <div className="h-2.5 bg-accent-amber/70" style={{ width: `${widths[index]}%` }} />
              </td>
              <td className={`${cell} w-14 text-right font-mono text-data`}>
                {format.percent(item.weightPct, 1, false)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {full && (
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-2 py-1.5 font-sans text-title text-secondary">
          {rest.others > 0 && (
            <span>
              {t('etfProfile.holdings.others', {
                count: rest.others,
                value: format.number(rest.others, 0),
              })}
              {': '}
              <span className="font-mono">{format.percent(rest.othersPct, 1, false)}</span>
            </span>
          )}
          {data.asOf && data.source && (
            <span>
              {t('etfProfile.holdings.asOf', {
                date: format.isoDate(data.asOf),
                source: t(`etfProfile.holdings.sources.${data.source}`),
              })}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
