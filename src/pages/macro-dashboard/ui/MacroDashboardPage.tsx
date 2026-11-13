import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useMacroCountries, useMacroSummary } from '@/entities/macro'
import { ScreenWorkspace } from '@/features/workspace-layout'
import {
  CemacComparisonPanel,
  CountrySelector,
  KeyIndicatorTiles,
  MacroChartPanel,
  SovereignRatesPanel,
} from '@/widgets/macro-dashboard-panels'
import { MACRO_DASHBOARD_LAYOUT } from '../config/layout'

/**
 * Screen 25, ECO (spec section 9): the country bar, the economy's six key indicator tiles (?country=,
 * Cameroon by default, as `ECO CMR` opens it), then the comparison chart, the sovereign and reference
 * rates and the CEMAC comparison table.
 */
export function MacroDashboardPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const countries = useMacroCountries()
  const asked = params.get('country')?.trim().toUpperCase()
  const list = countries.data
  const known = list?.find((country) => country.code === asked)
  const selected = known?.code ?? list?.at(0)?.code
  const summary = useMacroSummary(selected)
  const select = (code: string) => setParams({ country: code }, { replace: true })

  const panels = {
    chart: <MacroChartPanel countries={list} />,
    rates: <SovereignRatesPanel />,
    table: <CemacComparisonPanel />,
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-2 px-2 pt-2">
        <CountrySelector
          countries={list}
          selected={selected}
          onSelect={select}
          latestYear={
            summary.data?.country.code === selected ? summary.data?.latestYear : undefined
          }
        />
        {asked && list && !known && (
          <p role="status" className="font-sans text-data text-warning">
            {t('eco.unknownCountry', { code: asked, country: list.at(0)?.code ?? '' })}
          </p>
        )}
        <KeyIndicatorTiles country={selected} />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace screenId="ECO" defaultLayout={MACRO_DASHBOARD_LAYOUT} panels={panels} />
      </div>
    </div>
  )
}
