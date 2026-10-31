import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { priceDecimals } from '@/entities/quote'
import { useSecurityProfile } from '@/entities/security'
import { useStoredPrices } from '@/entities/stored-price'
import type { StoredPriceDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { addDays } from '@/shared/lib/isoDate'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { QueryView } from '@/shared/ui/QueryView'
import { useSourceText } from '../model/useSourceText'

const helper = createDataColumnHelper<StoredPriceDto>()
const getDate = (price: StoredPriceDto) => price.date
/** Two months of sessions; an older one is typed in the session field. */
const DAYS = 62

/** CORR: the stored sessions of the security, newest first; a click picks one to correct. */
export function StoredPricesPanel({
  securityId,
  date,
  onDateChange,
}: {
  securityId: string | null
  date: string | null
  onDateChange: (date: string) => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const today = useMarketDay()
  const profile = useSecurityProfile(securityId ?? undefined)
  const prices = useStoredPrices(securityId, addDays(today, -DAYS), today)
  const sourceText = useSourceText()
  const decimals = profile.data ? priceDecimals(profile.data.type, profile.data.currency) : 0

  const columns = useMemo(() => {
    const price = (key: 'open' | 'high' | 'low' | 'close', header: string) =>
      helper.accessor(key, {
        header,
        meta: { align: 'right' },
        cell: ({ getValue }) => format.number(getValue(), decimals),
      })
    return helper.columns([
      helper.accessor('date', {
        header: t('columns.date'),
        meta: { width: '92px' },
        cell: ({ getValue }) => format.isoDate(getValue()),
      }),
      price('open', t('corrections.fields.open')),
      price('high', t('corrections.fields.high')),
      price('low', t('corrections.fields.low')),
      price('close', t('corrections.fields.close')),
      helper.accessor('volume', {
        header: t('corrections.fields.volume'),
        meta: { align: 'right' },
        cell: ({ getValue }) => format.number(getValue(), 0),
      }),
      helper.accessor(sourceText, {
        id: 'source',
        header: t('corrections.sourceColumn'),
        meta: { width: '1.8fr' },
        cell: ({ row, getValue }) => (
          <span
            className={
              row.original.source === 'correction' ? 'text-accent-amber' : 'text-secondary'
            }
          >
            {getValue()}
          </span>
        ),
      }),
    ])
  }, [t, format, decimals, sourceText])

  return (
    <Panel
      title={t('panels.storedPrices')}
      code="CORR"
      options={profile.data && <span>{profile.data.code}</span>}
    >
      {!securityId ? (
        <PanelEmpty message={t('corrections.pick')} />
      ) : (
        <QueryView query={prices}>
          {(rows) => (
            <DataTable
              data={rows}
              columns={columns}
              getRowId={getDate}
              selectedRowId={date}
              onRowClick={(row) => onDateChange(row.date)}
              exportName={`cmarket-prices-${securityId}`}
              emptyMessage={t('corrections.noSessions')}
            />
          )}
        </QueryView>
      )}
    </Panel>
  )
}
