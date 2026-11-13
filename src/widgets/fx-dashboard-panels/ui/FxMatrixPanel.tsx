import { useTranslation } from 'react-i18next'
import { useFxMatrix } from '@/entities/rate'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { crossDecimals, PARITY_DECIMALS } from '../lib/fxDecimals'

const MISSING = '—'
const DIAGONAL = '–'

/**
 * Screen 26, the cross-rate matrix (spec section 9): the Admin's currencies (EUR, USD, GBP, CNY,
 * XAF by default), "1 unit in row = … in column" at the day's reference rates; the euro's franc
 * the parity, 655.957. A table whose headers name each cell for screen readers. API /fx/matrix.
 */
export function FxMatrixPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const matrix = useFxMatrix()

  return (
    <Panel title={t('panels.fxMatrix')} code="FX" options={<span>{t('fx.matrixCaption')}</span>}>
      <QueryView query={matrix}>
        {({ currencies, rates }) => (
          <table className="w-full font-mono text-data tabular-nums">
            <caption className="sr-only">{t('fx.matrixCaption')}</caption>
            <thead>
              <tr className="h-row">
                <td />
                {currencies.map((currency) => (
                  <th
                    key={currency}
                    scope="col"
                    className="px-3 text-right font-semibold text-accent-amber"
                  >
                    {currency}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currencies.map((row, rowIndex) => (
                <tr key={row} className="h-row even:bg-row-alt">
                  <th scope="row" className="px-3 text-left font-semibold text-accent-amber">
                    {row}
                  </th>
                  {currencies.map((column, columnIndex) => {
                    const value = rates[rowIndex]?.[columnIndex] ?? null
                    const parity = row === 'EUR' && column === 'XAF'
                    return (
                      <td key={column} className="px-3 text-right text-primary">
                        {rowIndex === columnIndex
                          ? DIAGONAL
                          : value === null
                            ? MISSING
                            : format.number(value, parity ? PARITY_DECIMALS : crossDecimals(value))}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </QueryView>
    </Panel>
  )
}
