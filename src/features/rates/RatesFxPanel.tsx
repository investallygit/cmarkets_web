import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'
import { ChangeText } from '@/shared/ui/ChangeText'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { PanelError, PanelLoading } from '@/shared/ui/StatusViews'
import { DASHBOARD_FX_PAIRS, useFxRates, usePolicyRates } from './api'

interface RateRow {
  id: string
  instrument: string
  value: number
  decimals: number
  /** Policy rates are in %, their change in points; FX changes are in %. */
  isRate: boolean
  change: number
}

const helper = createDataColumnHelper<RateRow>()
const getRowId = (row: RateRow) => row.id

/** Screen 1, Rates and FX: BEAC policy rates and XAF exchange rates. API /rates/policy, /fx. */
export function RatesFxPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const policy = usePolicyRates()
  const fx = useFxRates(DASHBOARD_FX_PAIRS)

  const rows = useMemo<RateRow[] | undefined>(() => {
    if (!policy.data || !fx.data) return undefined
    return [
      ...policy.data.map((rate) => ({
        id: rate.id,
        instrument: rate.name,
        value: rate.value,
        decimals: 2,
        isRate: true,
        change: rate.change,
      })),
      ...fx.data.map((rate) => ({
        id: rate.pair,
        instrument: `${rate.base} / ${rate.quote}${rate.isFixed ? ` (${t('market.fixedPeg')})` : ''}`,
        value: rate.value,
        decimals: rate.decimals,
        isRate: false,
        change: rate.changePct,
      })),
    ]
  }, [policy.data, fx.data, t])

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('instrument', {
          header: t('columns.instrument'),
          meta: { width: '2.4fr' },
        }),
        helper.accessor('value', {
          header: t('columns.value'),
          meta: { align: 'right' },
          cell: ({ row }) =>
            row.original.isRate
              ? format.percent(row.original.value, row.original.decimals, false)
              : format.number(row.original.value, row.original.decimals),
        }),
        helper.accessor('change', {
          header: t('columns.change'),
          meta: { align: 'right' },
          cell: ({ row }) => (
            <ChangeText
              value={row.original.change}
              percent={!row.original.isRate}
              plusSign={!row.original.isRate}
            />
          ),
        }),
      ]),
    [t, format],
  )

  const error = policy.error ?? fx.error
  return (
    <Panel title={t('panels.ratesFx')} code="FX">
      {error ? (
        <PanelError
          error={error}
          onRetry={() => {
            void policy.refetch()
            void fx.refetch()
          }}
        />
      ) : rows ? (
        <DataTable
          data={rows}
          columns={columns}
          getRowId={getRowId}
          enableSorting={false}
          exportName="rates-fx"
        />
      ) : (
        <PanelLoading />
      )}
    </Panel>
  )
}
