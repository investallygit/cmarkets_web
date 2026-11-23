import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useIndexConstituents, useSectorName } from '@/entities/market'
import type { IndexConstituentDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { securityPath } from '@/shared/routes/paths'
import { ChangeText } from '@/shared/ui/ChangeText'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ConstituentHistoryButton } from './ConstituentHistoryButton'

const helper = createDataColumnHelper<IndexConstituentDto>()

interface IndexConstituentsPanelProps {
  code: string
  /** DES: today's contributions; MEMB: the composition on a date, with each member's span. */
  screen: 'DES' | 'MEMB'
}

/**
 * Screen 31, "Constituents" (spec section 9, fifth version): each constituent's sector, weight at
 * the previous close, price, day's change and contribution in points, which add up to the index's
 * change; a double click opens its profile. MEMB shows the composition in force on a date chosen,
 * with each member's entry and exit, and the constituents' history as XLSX.
 * API /indices/{code}/constituents?date=.
 */
export function IndexConstituentsPanel({ code, screen }: IndexConstituentsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const navigate = useNavigate()
  const sectorName = useSectorName()
  const [date, setDate] = useState<string | null>(null)
  const constituents = useIndexConstituents(code, screen === 'MEMB' ? date : null)
  const data = constituents.data

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('code', {
          header: t('indexProfile.constituents.security'),
          cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
        }),
        helper.accessor((row) => sectorName(row.sector), {
          id: 'sector',
          header: t('indexProfile.constituents.sector'),
        }),
        helper.accessor('weightPct', {
          header: t('indexProfile.constituents.weight'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.percent(getValue(), 1, false),
        }),
        helper.accessor('price', {
          header: t('indexProfile.constituents.price'),
          meta: { align: 'right' },
          cell: ({ getValue }) => {
            const price = getValue()
            return price === null ? '—' : format.number(price, price >= 1000 ? 0 : 2)
          },
        }),
        helper.accessor('changePct', {
          header: t('indexProfile.constituents.change'),
          meta: { align: 'right' },
          cell: ({ getValue }) => <ChangeText value={getValue()} percent />,
        }),
        helper.accessor('contribution', {
          header: t('indexProfile.constituents.contribution'),
          meta: { align: 'right' },
          cell: ({ getValue }) => (
            <ChangeText value={getValue()} suffix={t('indexProfile.constituents.points')} />
          ),
        }),
        ...(screen === 'MEMB'
          ? [
              helper.accessor('entryDate', {
                header: t('indexProfile.constituents.entry'),
                meta: { align: 'right' },
                cell: ({ getValue }) => format.isoDate(getValue()),
              }),
              helper.accessor('exitDate', {
                header: t('indexProfile.constituents.exit'),
                meta: { align: 'right' },
                cell: ({ getValue }) => {
                  const exit = getValue()
                  return exit === null ? '—' : format.isoDate(exit)
                },
              }),
            ]
          : []),
      ]),
    [t, format, sectorName, screen],
  )

  return (
    <Panel
      title={t('panels.constituents')}
      code={screen}
      options={
        data && (
          <span>
            {t('indexProfile.constituents.options', {
              count: data.constituents.length,
              date: format.isoDate(data.date),
            })}
          </span>
        )
      }
      bodyClassName="flex flex-col"
    >
      {screen === 'MEMB' && (
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b px-2 py-1.5">
          <label className="flex items-center gap-2 font-sans text-data text-secondary">
            {t('indexProfile.constituents.on')}
            <DateInput value={date ?? data?.date ?? null} onChange={setDate} className="w-36" />
          </label>
          <ConstituentHistoryButton code={code} />
        </div>
      )}
      <QueryView query={constituents}>
        {(loaded) => (
          <>
            <div className="min-h-0 flex-1">
              <DataTable
                data={loaded.constituents}
                columns={columns}
                getRowId={(row) => row.securityId}
                exportName={`${code}-constituents-${loaded.date}`}
                onRowDoubleClick={(row) => void navigate(securityPath(row.securityId))}
                emptyMessage={t('indexProfile.constituents.none')}
              />
            </div>
            <p className="shrink-0 border-t px-2 py-1.5 font-sans text-caption text-secondary">
              {t('indexProfile.constituents.sum', {
                sum: format.signed(loaded.contributionSum, 2),
                change: format.percent(loaded.indexChangePct, 2),
              })}{' '}
              {loaded.constituents.some((member) => member.publishedWeight)
                ? t('indexProfile.constituents.publishedNote')
                : t('indexProfile.constituents.capNote')}
            </p>
          </>
        )}
      </QueryView>
    </Panel>
  )
}
