import { useTranslation } from 'react-i18next'
import { useIndexPerformance } from '@/entities/market'
import type { IndexPerformanceDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ChangeText } from '@/shared/ui/ChangeText'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'

type Row = {
  key:
    | 'oneMonth'
    | 'threeMonths'
    | 'ytd'
    | 'oneYear'
    | 'threeYears'
    | 'volatility'
    | 'drawdown'
    | 'dividendYield'
  value: number | null
  kind: 'change' | 'plain' | 'down'
}

const ROWS = (data: IndexPerformanceDto): Row[] => [
  { key: 'oneMonth', value: data.oneMonthPct, kind: 'change' },
  { key: 'threeMonths', value: data.threeMonthsPct, kind: 'change' },
  { key: 'ytd', value: data.ytdPct, kind: 'change' },
  { key: 'oneYear', value: data.oneYearPct, kind: 'change' },
  { key: 'threeYears', value: data.threeYearsAnnualisedPct, kind: 'change' },
  { key: 'volatility', value: data.volatilityPct, kind: 'plain' },
  { key: 'drawdown', value: data.maxDrawdownPct, kind: 'down' },
  { key: 'dividendYield', value: data.dividendYieldPct, kind: 'plain' },
]

/**
 * Screen 31, "Performance and risk" (spec section 9, fifth version; section 14.3): 1 and 3 months,
 * YTD, 1 year, 3 years annualised, the year's volatility and maximum drawdown on the closes, the
 * constituents' dividend yield as the index weighs them. API /indices/{code}/performance.
 */
export function IndexPerformancePanel({ code, screen }: { code: string; screen: 'DES' | 'PERF' }) {
  const { t } = useTranslation()
  const format = useFormat()
  const performance = useIndexPerformance(code)

  return (
    <Panel title={t('panels.indexPerformance')} code={screen === 'DES' ? 'PERF' : screen}>
      <QueryView query={performance}>
        {(data) => (
          <ScrollArea className="h-full">
            <dl className="font-mono text-data">
              {ROWS(data).map((row, index) => (
                <div
                  key={row.key}
                  className={`flex h-row items-center justify-between px-2 ${index % 2 === 1 ? 'bg-row-alt' : ''}`}
                >
                  <dt className="font-sans text-secondary">
                    {t(`indexProfile.performance.${row.key}`)}
                  </dt>
                  <dd>
                    {row.value === null ? (
                      <span className="text-secondary">—</span>
                    ) : row.kind === 'change' ? (
                      <ChangeText value={row.value} percent decimals={1} />
                    ) : row.kind === 'down' ? (
                      <span className={row.value < 0 ? 'text-down' : ''}>
                        {format.percent(row.value, 1, false)}
                      </span>
                    ) : (
                      format.percent(row.value, 1, false)
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="px-2 py-1.5 font-sans text-caption text-secondary">
              {t('indexProfile.performance.note', { date: format.isoDate(data.date) })}
            </p>
          </ScrollArea>
        )}
      </QueryView>
    </Panel>
  )
}
