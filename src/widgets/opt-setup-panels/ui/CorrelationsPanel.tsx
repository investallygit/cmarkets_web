import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  editSetup,
  enteredCorrelation,
  setCorrelation,
  shortCode,
  useOptEstimates,
  useOptimizer,
  useOptimizerTexts,
} from '@/entities/optimizer'
import { useFormat } from '@/shared/i18n'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Panel } from '@/shared/ui/Panel'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { cellTone } from '../lib/cellTone'

/**
 * Screen 28, panel 3: the correlations of the history, shrunk towards their average (spec section
 * 14.6), each cell editable; the brighter the cell, the closer the two securities move.
 */
export function CorrelationsPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const texts = useOptimizerTexts()
  const setup = useOptimizer((state) => state.setup)
  const ids = useMemo(() => setup.universe.map((item) => item.securityId), [setup.universe])
  const estimates = useOptEstimates(ids, setup.history, setup.frequency)
  const [editing, setEditing] = useState<{ a: string; b: string } | null>(null)
  const data = estimates.data
  // The estimates answer for the universe they were asked for: while a new one loads, the ids may differ.
  const matrix = data && data.securities.length === ids.length ? data : null

  return (
    <Panel
      title={`3 · ${t('opt.correlations.title', { history: t(`opt.objective.histories.${setup.history}`) })}`}
      code="OPT"
      options={
        <span className="font-sans text-label text-secondary uppercase">
          {t('opt.correlations.editable')}
        </span>
      }
    >
      <ScrollArea className="h-full">
        {!matrix ? (
          <p className="p-3 font-sans text-data text-secondary">{t('opt.correlations.empty')}</p>
        ) : (
          <div className="p-2">
            <table className="border-separate border-spacing-0.5 font-mono text-label tabular-nums">
              <thead>
                <tr>
                  <td />
                  {matrix.securities.map((security) => (
                    <th
                      key={security.securityId}
                      scope="col"
                      className="px-1 font-normal text-secondary"
                      title={security.code}
                    >
                      {shortCode(security.code)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.securities.map((row, i) => (
                  <tr key={row.securityId}>
                    <th
                      scope="row"
                      className="pr-1 text-right font-normal text-secondary"
                      title={row.code}
                    >
                      {shortCode(row.code)}
                    </th>
                    {matrix.securities.map((column, j) => {
                      const estimate = matrix.correlations[i]?.[j] ?? 0
                      const entered =
                        i === j
                          ? null
                          : enteredCorrelation(
                              setup.correlations,
                              row.securityId,
                              column.securityId,
                            )
                      const value = i === j ? 1 : (entered ?? estimate)
                      const isEditing =
                        editing !== null &&
                        editing.a === row.securityId &&
                        editing.b === column.securityId
                      const names = {
                        a: texts.code(row.securityId),
                        b: texts.code(column.securityId),
                      }
                      if (isEditing)
                        return (
                          <td key={column.securityId}>
                            <NumberInput
                              autoFocus
                              value={entered ?? estimate}
                              onChange={(next) =>
                                editSetup((current) =>
                                  setCorrelation(current, row.securityId, column.securityId, next),
                                )
                              }
                              onBlur={() => setEditing(null)}
                              onKeyDown={(event) => {
                                if (event.key === 'Escape' || event.key === 'Enter')
                                  setEditing(null)
                              }}
                              aria-label={t('opt.correlations.edit', names)}
                              className="w-16"
                            />
                          </td>
                        )
                      const tone = cellTone(value)
                      return (
                        <td key={column.securityId}>
                          <button
                            type="button"
                            disabled={i === j}
                            onClick={() => setEditing({ a: row.securityId, b: column.securityId })}
                            onKeyDown={(event) => {
                              if (
                                (event.key === 'Delete' || event.key === 'Backspace') &&
                                entered !== null
                              )
                                editSetup((current) =>
                                  setCorrelation(current, row.securityId, column.securityId, null),
                                )
                            }}
                            title={
                              entered !== null
                                ? `${t('opt.correlations.entered', { value: format.number(estimate, 2) })} ${t('opt.correlations.reset')}: Delete`
                                : undefined
                            }
                            aria-label={t('opt.correlations.cell', {
                              ...names,
                              value: format.number(value, 2),
                            })}
                            className={`h-9 w-11 outline-none focus-visible:ring-1 focus-visible:ring-accent-amber ${entered !== null ? 'underline decoration-dotted' : ''}`}
                            style={{ backgroundColor: tone.background, color: tone.text }}
                          >
                            {format.number(value, 2)}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 font-sans text-data text-secondary">
              {t('opt.correlations.caption')}
            </p>
            <p className="font-sans text-label text-secondary">
              {t('opt.correlations.shrinkage', {
                value: format.percent(matrix.shrinkage * 100, 0, false),
              })}
            </p>
          </div>
        )}
      </ScrollArea>
    </Panel>
  )
}
