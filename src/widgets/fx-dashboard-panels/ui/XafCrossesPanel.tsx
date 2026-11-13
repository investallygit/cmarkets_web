import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrencyName, useXafCrosses } from '@/entities/rate'
import type { XafCrossDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ChangeText } from '@/shared/ui/ChangeText'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { crossDecimals, ecbDecimals } from '../lib/fxDecimals'

const helper = createDataColumnHelper<XafCrossDto>()
const getCurrency = (cross: XafCrossDto) => cross.currency
const MISSING = '—'
/** A figure never shrinks below its "-22.50%" or "17,123.45": a narrow table scrolls sideways. */
const FIGURE_WIDTH = 'minmax(76px, 1fr)'

type ChangeKey = keyof XafCrossDto['changes']

const CHANGES: readonly ChangeKey[] = ['day', 'month', 'ytd', 'year']

interface XafCrossesPanelProps {
  /** The currency the chart draws: its row is selected. */
  selected: string | undefined
  onSelect: (currency: string) => void
}

/**
 * Screen 26, cross rates against XAF (spec section 9): the Admin's currencies at the ECB's
 * reference rate, the XAF per unit (per 100 yen), the changes over a day, a month, the year and a
 * year; a click, or the arrow keys, draws the currency. The note says the rates are indicative.
 * API /fx/xaf-crosses.
 */
export function XafCrossesPanel({ selected, onSelect }: XafCrossesPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const name = useCurrencyName()
  const crosses = useXafCrosses()

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('currency', {
          header: t('fx.columns.currency'),
          meta: { width: 'minmax(76px, 0.8fr)' },
          cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
        }),
        helper.accessor((row) => name(row), {
          id: 'name',
          header: t('fx.columns.name'),
          meta: { width: 'minmax(128px, 1.8fr)' },
          cell: ({ getValue }) => <span className="font-sans">{getValue()}</span>,
        }),
        helper.accessor('ecbRate', {
          header: t('fx.columns.ecbRate'),
          meta: { align: 'right', width: 'minmax(96px, 1.1fr)' },
          cell: ({ getValue }) => format.number(getValue(), ecbDecimals(getValue())),
        }),
        helper.accessor('xaf', {
          header: t('fx.columns.xaf'),
          meta: { align: 'right', width: FIGURE_WIDTH },
          cell: ({ getValue }) => (
            <span className="text-primary">
              {format.number(getValue(), crossDecimals(getValue()))}
            </span>
          ),
        }),
        ...CHANGES.map((key) =>
          helper.accessor((row) => row.changes[key] ?? undefined, {
            id: key,
            header: t(`fx.columns.${key}`),
            meta: { align: 'right', width: FIGURE_WIDTH },
            cell: ({ getValue }) => {
              const value = getValue()
              return value === undefined ? MISSING : <ChangeText value={value} percent />
            },
          }),
        ),
      ]),
    [t, format, name],
  )

  return (
    <Panel title={t('panels.fxCrosses')} code="FX" options={<span>{t('fx.perUnit')}</span>}>
      <QueryView
        query={crosses}
        isEmpty={(data) => data.crosses.length === 0}
        emptyMessage={t('fx.noRates')}
      >
        {(data) => (
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1">
              <DataTable
                data={data.crosses}
                columns={columns}
                getRowId={getCurrency}
                selectedRowId={selected ?? data.crosses.at(0)?.currency}
                onRowClick={(cross) => onSelect(cross.currency)}
                exportName="fx-xaf-crosses"
              />
            </div>
            <p className="shrink-0 border-t px-3 py-2 font-sans text-label text-secondary">
              {t('fx.formula')}
              <br />
              {t('fx.indicative')}
            </p>
          </div>
        )}
      </QueryView>
    </Panel>
  )
}
