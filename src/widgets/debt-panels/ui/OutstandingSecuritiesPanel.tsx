import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { billions, DEBT_ZONE, useDebtSecurities } from '@/entities/debt'
import type { DebtSecurityDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { securityPath } from '@/shared/routes/paths'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<DebtSecurityDto>()
const idOf = (security: DebtSecurityDto) => security.securityId

/**
 * DEBT's outstanding securities (screen 35, sixth version): each BTA and OTA still owed, its
 * issue and maturity, its outstanding in billions, its rate (a BTA's auction average, an OTA's
 * coupon), its last yield and the years left; a double click opens its profile. The state's
 * column only for the zone. API /debt/{country}/securities.
 */
export function OutstandingSecuritiesPanel({ country }: { country: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const navigate = useNavigate()
  const securities = useDebtSecurities(country)
  const zone = country === DEBT_ZONE

  const columns = useMemo(() => {
    const percent = (value: number | null) =>
      value === null ? '—' : format.percent(value, 2, false)
    return helper.columns([
      helper.accessor('code', {
        header: t('debt.securities.columns.security'),
        cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
      }),
      ...(zone
        ? [helper.accessor('country', { header: t('debt.securities.columns.country') })]
        : []),
      helper.accessor('instrument', {
        header: t('debt.securities.columns.type'),
        cell: ({ getValue }) => (
          <span className="text-accent-amber">{t(`debt.securities.${getValue()}`)}</span>
        ),
      }),
      helper.accessor('issueDate', {
        header: t('debt.securities.columns.issue'),
        cell: ({ getValue }) => (
          <span className="text-secondary">{format.isoDate(getValue())}</span>
        ),
      }),
      helper.accessor('maturityDate', {
        header: t('debt.securities.columns.maturity'),
        cell: ({ getValue }) => format.isoDate(getValue()),
      }),
      helper.accessor((security) => billions(security.outstanding), {
        id: 'outstanding',
        header: t('debt.securities.columns.outstanding'),
        meta: { align: 'right' },
        cell: ({ getValue }) => format.number(getValue(), 1),
      }),
      helper.accessor('ratePct', {
        header: t('debt.securities.columns.rate'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <span className="text-secondary">{percent(getValue())}</span>,
      }),
      helper.accessor('yieldPct', {
        header: t('debt.securities.columns.yield'),
        meta: { align: 'right' },
        cell: ({ getValue }) => percent(getValue()),
      }),
      helper.accessor('yearsLeft', {
        header: t('debt.securities.columns.yearsLeft'),
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className="text-secondary">{format.number(getValue(), 2)}</span>
        ),
      }),
    ])
  }, [t, format, zone])

  return (
    <Panel
      title={t('panels.debtSecurities')}
      code="DEBT"
      options={t('debt.securities.options', { count: securities.data?.items.length ?? 0 })}
      bodyClassName="flex flex-col"
    >
      <QueryView
        query={securities}
        isEmpty={(data) => data.items.length === 0}
        emptyMessage={t('debt.securities.empty')}
      >
        {(data) => (
          <DataTable
            data={data.items}
            columns={columns}
            getRowId={idOf}
            onRowDoubleClick={(security) => void navigate(securityPath(security.securityId))}
            exportName={`debt-securities-${country.toLowerCase()}`}
          />
        )}
      </QueryView>
      <p className="shrink-0 border-t px-3 py-1 font-sans text-title text-secondary">
        {t('debt.securities.note')}
      </p>
    </Panel>
  )
}
