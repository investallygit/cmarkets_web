import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { debtCountry, useDebtSecurities } from '@/entities/debt'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { downloadCsv } from '@/shared/lib/csv'
import {
  DebtComparisonPanel,
  DebtCountryBar,
  DebtIndicators,
  OutstandingSecuritiesPanel,
  RatingsDocumentsPanel,
  RedemptionSchedulePanel,
  useDebtCountryName,
} from '@/widgets/debt-panels'
import { DEBT_LAYOUT } from '../config/layout'
import { securitiesRows } from '../lib/download'

/** Cameroon, as the mockup and `DEBT` alone open it. */
const DEFAULT_COUNTRY = 'CMR'

/**
 * DEBT, the CEMAC states' debt on the BEAC's market (screen 35, sixth version; ROADMAP step 66):
 * the country bar (?country=, Cameroon by default, as `DEBT CMR` opens it; CEMAC for the zone),
 * the six indicators, the redemption schedule, the CEMAC comparison, the outstanding securities
 * and the ratings and documents; Download writes the securities shown (decision 60).
 */
export function DebtPage() {
  const { t } = useTranslation()
  const name = useDebtCountryName()
  const [params, setParams] = useSearchParams()
  const asked = params.get('country')
  const known = debtCountry(asked)
  const country = known ?? DEFAULT_COUNTRY
  const securities = useDebtSecurities(country).data
  const select = (code: string) => setParams({ country: code }, { replace: true })

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-2 px-2 pt-2">
        <DebtCountryBar
          selected={country}
          onSelect={select}
          asOf={securities?.asOf}
          onDownload={
            securities
              ? () =>
                  downloadCsv(
                    `debt-${country.toLowerCase()}-${securities.asOf}`,
                    securitiesRows(securities),
                  )
              : undefined
          }
        />
        {asked && !known && (
          <p role="status" className="font-sans text-data text-warning">
            {t('debt.unknownCountry', { code: asked.toUpperCase(), country: name(country) })}
          </p>
        )}
        <DebtIndicators country={country} />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace
          screenId="DEBT"
          defaultLayout={DEBT_LAYOUT}
          panels={{
            schedule: <RedemptionSchedulePanel country={country} />,
            compare: <DebtComparisonPanel selected={country} onSelect={select} />,
            securities: <OutstandingSecuritiesPanel country={country} />,
            documents: <RatingsDocumentsPanel country={country} />,
          }}
        />
      </div>
    </div>
  )
}
