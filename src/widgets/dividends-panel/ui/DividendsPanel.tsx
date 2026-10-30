import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDividends } from '@/entities/security'
import type { DividendDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<DividendDto>()

/** "2026-07-08" -> "07/2026". */
const monthYear = (date: string) => `${date.slice(5, 7)}/${date.slice(0, 4)}`

interface DividendsPanelProps {
  securityId: string
  /** full: the DVD tab, with the type and the ex-date of each dividend. */
  variant?: 'compact' | 'full'
}

/** Screen 2, dividends, newest first (DES and DVD tabs). API /securities/{id}/dividends. */
export function DividendsPanel({ securityId, variant = 'compact' }: DividendsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const dividends = useDividends(securityId)
  const full = variant === 'full'

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('fiscalYear', {
          header: t('columns.fiscalYear'),
          cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
        }),
        ...(full
          ? [
              helper.accessor('kind', {
                header: t('columns.type'),
                cell: ({ getValue }) => t(`dividendKinds.${getValue()}`),
              }),
              helper.accessor('exDate', {
                header: t('columns.exDate'),
                meta: { align: 'right' },
                cell: ({ getValue }) => format.isoDate(getValue()),
              }),
            ]
          : []),
        helper.accessor('amount', {
          header: t('columns.netPerShare'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
        helper.accessor('paymentDate', {
          header: t('columns.payment'),
          meta: { align: 'right' },
          cell: ({ getValue }) => (full ? format.isoDate(getValue()) : monthYear(getValue())),
        }),
        helper.accessor('yieldPct', {
          header: t('columns.yield'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.percent(getValue(), 1, false),
        }),
      ]),
    [t, format, full],
  )

  return (
    <Panel title={t('panels.dividends')} code="DVD">
      <QueryView query={dividends}>
        {(data) => (
          <DataTable
            data={data}
            columns={columns}
            getRowId={(dividend) => `${dividend.fiscalYear}-${dividend.kind}`}
            exportName={`dividends-${securityId}`}
          />
        )}
      </QueryView>
    </Panel>
  )
}
