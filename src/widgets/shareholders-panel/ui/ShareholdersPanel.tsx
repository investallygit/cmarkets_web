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

/** The holder CMarket.Api gives the shares no one keeps (Shareholding.FreeFloatName). */
const FREE_FLOAT = 'Free float'

/** Screen 2, HDS tab: holders of the capital. API /securities/{id}/shareholders. */
export function ShareholdersPanel({ securityId }: { securityId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const shareholders = useShareholders(securityId)

  const columns = useMemo(
    () =>
      helper.columns([
        // CMarket.Api names the shares no holder keeps "Free float" (B17: on a French page too).
        helper.accessor(
          (holder) => (holder.name === FREE_FLOAT ? t('keyData.freeFloat') : holder.name),
          {
            id: 'name',
            header: t('columns.holder'),
          },
        ),
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
