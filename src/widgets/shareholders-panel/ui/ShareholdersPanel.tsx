import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useShareholders } from '@/entities/security'
import type { ShareholderDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<ShareholderDto>()

/** Screen 2, HDS tab: holders of the capital. API /securities/{id}/shareholders. */
export function ShareholdersPanel({ securityId }: { securityId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const shareholders = useShareholders(securityId)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('name', { header: t('columns.holder') }),
        helper.accessor('shares', {
          header: t('columns.shares'),
          meta: { align: 'right', width: '120px' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
        helper.accessor('pct', {
          header: t('columns.capitalPct'),
          meta: { align: 'right', width: '120px' },
          cell: ({ getValue }) => format.percent(getValue(), 1, false),
        }),
      ]),
    [t, format],
  )

  return (
    <Panel
      title={t('panels.shareholders')}
      code="HDS"
      options={
        shareholders.data && (
          <span>{t('shareholders.asOf', { date: format.isoDate(shareholders.data.asOf) })}</span>
        )
      }
    >
      <QueryView query={shareholders}>
        {(data) => (
          <DataTable
            data={data.items}
            columns={columns}
            getRowId={(holder) => holder.name}
            exportName={`shareholders-${securityId}`}
          />
        )}
      </QueryView>
    </Panel>
  )
}
