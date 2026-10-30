import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFinancials } from '@/entities/fundamentals'
import type { FinancialLineKey, FinancialStatement } from '@/shared/api/contracts'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { StatementTable } from './StatementTable'

const STATEMENTS: readonly FinancialStatement[] = ['income', 'balance', 'cashflow']

interface StatementPanelProps {
  securityId: string | undefined
  /** Display code of the security, e.g. "SEMC". */
  code: string | undefined
}

/**
 * Screen 3, financial statements: five fiscal years and the growth over them; tabs Income /
 * Balance / Cash flow. API /securities/{id}/financials.
 */
export function FinancialStatementsPanel({ securityId, code }: StatementPanelProps) {
  const { t } = useTranslation()
  const [statement, setStatement] = useState<FinancialStatement>('income')
  const financials = useFinancials(securityId, statement)
  const tabs = useMemo(
    () => STATEMENTS.map((value) => ({ value, label: t(`financials.tabs.${value}`) })),
    [t],
  )
  const name = t(`financials.statements.${statement}`)
  const currency = financials.data?.currency

  return (
    <Panel
      title={
        code && currency
          ? t('financials.title', {
              code,
              statement: name,
              unit: t('financials.unit', { currency }),
            })
          : name
      }
      code="FA"
      options={<PanelTabs value={statement} options={tabs} onChange={setStatement} />}
    >
      {!securityId ? (
        <PanelEmpty message={t('financials.noSecurity')} />
      ) : (
        <QueryView query={financials}>
          {(data) => (
            <StatementTable
              fiscalYears={data.fiscalYears}
              currency={data.currency}
              lines={data.lines}
              exportName={`${code ?? securityId}-${statement}`}
            />
          )}
        </QueryView>
      )}
    </Panel>
  )
}

/** The key lines of the balance sheet and the cash flow statement (screen 3 mockup). */
const SUMMARY_LINES: readonly [FinancialStatement, FinancialLineKey][] = [
  ['balance', 'totalAssets'],
  ['balance', 'shareholdersEquity'],
  ['balance', 'netFinancialDebt'],
  ['cashflow', 'operatingCashFlow'],
]

/** Screen 3, balance sheet and cash flow: their key lines over the same years. */
export function FinancialSummaryPanel({ securityId, code }: StatementPanelProps) {
  const { t } = useTranslation()
  const balance = useFinancials(securityId, 'balance')
  const cashflow = useFinancials(securityId, 'cashflow')
  const currency = balance.data?.currency

  return (
    <Panel
      title={
        currency
          ? t('financials.summaryTitle', { unit: t('financials.unit', { currency }) })
          : t('financials.summary')
      }
      code="FA"
    >
      {!securityId ? (
        <PanelEmpty message={t('financials.noSecurity')} />
      ) : (
        <QueryView query={balance}>
          {(balanceSheet) => (
            <QueryView query={cashflow}>
              {(cashFlows) => (
                <StatementTable
                  fiscalYears={balanceSheet.fiscalYears}
                  currency={balanceSheet.currency}
                  lines={SUMMARY_LINES.flatMap(([statement, key]) =>
                    (statement === 'balance' ? balanceSheet : cashFlows).lines.filter(
                      (line) => line.key === key,
                    ),
                  )}
                  exportName={`${code ?? securityId}-balance-cashflow`}
                />
              )}
            </QueryView>
          )}
        </QueryView>
      )}
    </Panel>
  )
}
