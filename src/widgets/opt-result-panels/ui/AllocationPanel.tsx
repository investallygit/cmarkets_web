import { useTranslation } from 'react-i18next'
import { OPT_CLASS_COLOR } from '@/entities/optimizer'
import type { OptResultDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { ScrollArea } from '@/shared/ui/ScrollArea'

/**
 * Screen 29's optimal allocation: each security's weight with its bar, the amount of whole
 * securities the capital buys, its share of the risk, "max" or "min" where a limit binds; the cash
 * the rounding leaves.
 */
export function AllocationPanel({ result }: { result: OptResultDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const widest = Math.max(...result.lines.map((line) => line.weightPct), 1)
  return (
    <Panel
      title={t('opt.allocation.title')}
      code="OPT RES"
      options={
        <span className="font-sans text-label text-secondary uppercase">
          {t('opt.allocation.capital', { amount: format.number(result.capital, 0) })}
        </span>
      }
    >
      <ScrollArea className="h-full">
        <table className="w-full border-collapse font-mono text-data tabular-nums">
          <thead className="sticky top-0 bg-panel-header font-sans text-secondary">
            <tr>
              <th scope="col" className="px-2 py-1 text-left font-normal">
                {t('opt.allocation.columns.security')}
              </th>
              <th scope="col" className="px-2 py-1 text-left font-normal">
                {t('opt.allocation.columns.type')}
              </th>
              <th scope="col" className="px-2 py-1 text-right font-normal">
                {t('opt.allocation.columns.weight')}
              </th>
              <th scope="col" className="w-32 px-2 py-1">
                <span className="sr-only">{t('opt.allocation.columns.weight')}</span>
              </th>
              <th scope="col" className="px-2 py-1 text-right font-normal">
                {t('opt.allocation.columns.quantity')}
              </th>
              <th scope="col" className="px-2 py-1 text-right font-normal">
                {t('opt.allocation.columns.amount')}
              </th>
              <th scope="col" className="px-2 py-1 text-right font-normal">
                {t('opt.allocation.columns.riskShare')}
              </th>
              <th scope="col" className="w-10 px-1">
                <span className="sr-only">{t('opt.allocation.max')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {result.lines.map((line, index) => (
              <tr key={line.securityId} className={index % 2 === 1 ? 'bg-row-alt' : undefined}>
                <th
                  scope="row"
                  className="px-2 py-1 text-left font-normal text-accent-amber"
                  title={line.name}
                >
                  {line.code}
                </th>
                <td
                  className="px-2 py-1 font-sans"
                  style={{ color: OPT_CLASS_COLOR[line.assetClass] }}
                >
                  {t(`opt.classes.${line.assetClass}`)}
                </td>
                <td className="px-2 py-1 text-right">{format.percent(line.weightPct, 1, false)}</td>
                <td className="px-2 py-1" aria-hidden>
                  <div
                    className="h-3"
                    style={{
                      width: `${(line.weightPct / widest) * 100}%`,
                      backgroundColor: OPT_CLASS_COLOR[line.assetClass],
                    }}
                  />
                </td>
                <td className="px-2 py-1 text-right">{format.number(line.quantity, 0)}</td>
                <td className="px-2 py-1 text-right">{format.number(line.amount, 0)}</td>
                <td className="px-2 py-1 text-right text-secondary">
                  {format.percent(line.riskSharePct, 1, false)}
                </td>
                <td className="px-1 py-1 text-accent-amber">
                  {line.bound ? t(`opt.allocation.${line.bound}`) : ''}
                </td>
              </tr>
            ))}
            <tr>
              <th
                scope="row"
                className="px-2 py-1 text-left font-normal text-secondary"
                colSpan={5}
              >
                {t('opt.allocation.cash')}
              </th>
              <td className="px-2 py-1 text-right text-secondary">
                {format.number(result.cash, 0)}
              </td>
              <td colSpan={2} />
            </tr>
            <tr className="border-t">
              <th scope="row" className="px-2 py-1 text-left font-normal text-accent-amber">
                {t('opt.allocation.total')}
              </th>
              <td />
              <td className="px-2 py-1 text-right text-accent-amber">
                {format.percent(
                  result.lines.reduce((sum, line) => sum + line.weightPct, 0),
                  1,
                  false,
                )}
              </td>
              <td colSpan={2} />
              <td className="px-2 py-1 text-right text-accent-amber">
                {format.number(result.capital, 0)}
              </td>
              <td className="px-2 py-1 text-right text-accent-amber">
                {format.percent(
                  result.lines.reduce((sum, line) => sum + line.riskSharePct, 0),
                  1,
                  false,
                )}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
        <p className="p-2 font-sans text-label text-secondary">{t('opt.allocation.caption')}</p>
      </ScrollArea>
    </Panel>
  )
}
