import { useQueryClient } from '@tanstack/react-query'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { priceDecimals, useLiveQuote } from '@/entities/quote'
import { securityKeys, tradesAtFixing, useSecuritySessions } from '@/entities/security'
import type { SecurityProfileDto, SessionPriceDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { securityPath } from '@/shared/routes/paths'
import { ChangeText } from '@/shared/ui/ChangeText'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable, type TableExporter } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { TableExportContext } from '@/shared/ui/tableExport'
import { DownloadDataLink } from '@/features/download-data'

const helper = createDataColumnHelper<SessionPriceDto>()

/** The sessions the panel offers (spec section 9, screen 2): 20 first, 12 in sight. */
const COUNTS = ['10', '20', '60'] as const
type Count = (typeof COUNTS)[number]

/**
 * Screen 2, "Prices of recent sessions" (spec section 9, fifth version), in place of the order book
 * and the latest trades: BVMAC trades at a fixing, one price a session, and a session without
 * trades has no price and is not listed, which the panel says. Each session's price, its change
 * from the session before, its volume and value traded; 10, 20 or 60 sessions; XLSX and CSV. A
 * fixing's QuoteUpdated reads them again. API /securities/{id}/sessions?last=.
 */
export function RecentSessionsPanel({ profile }: { profile: SecurityProfileDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const queryClient = useQueryClient()
  const canExport = useContext(TableExportContext)
  const exportRef = useRef<TableExporter | null>(null)
  const [count, setCount] = useState<Count>('20')
  const sessions = useSecuritySessions(profile.id, Number(count))
  const decimals = priceDecimals(profile.type, profile.currency)
  const fixing = tradesAtFixing(profile)

  // A new fixing is a new session at the top of the list.
  const liveAt = useLiveQuote(profile.id)?.ts
  useEffect(() => {
    if (liveAt)
      void queryClient.invalidateQueries({ queryKey: [...securityKeys.of(profile.id), 'sessions'] })
  }, [liveAt, profile.id, queryClient])

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('session', {
          header: t('sessions.session'),
          cell: ({ getValue }) => format.isoDate(getValue()),
        }),
        helper.accessor('price', {
          header: t('sessions.price'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), decimals),
        }),
        helper.accessor('change', {
          header: t('sessions.change'),
          meta: { align: 'right' },
          cell: ({ getValue }) => <ChangeText value={getValue()} decimals={decimals} />,
        }),
        helper.accessor('changePct', {
          header: t('sessions.changePct'),
          meta: { align: 'right' },
          cell: ({ getValue }) => <ChangeText value={getValue()} percent />,
        }),
        helper.accessor('volume', {
          header: t('sessions.volume'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
        helper.accessor('value', {
          header: t('sessions.value'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue() / 1_000_000, 1),
        }),
      ]),
    [t, format, decimals],
  )

  return (
    <Panel
      title={t('panels.recentSessions')}
      code="DES"
      options={
        <>
          <DownloadDataLink dataset="prices" items={[profile.id]} what={profile.code} />
          <PanelTabs
            value={count}
            options={COUNTS.map((value) => ({
              value,
              label: t('sessions.count', { count: Number(value) }),
            }))}
            onChange={setCount}
          />
          {canExport && (
            <>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={() => exportRef.current?.('xlsx')}
                className="panel-no-drag min-h-6 uppercase hover:text-primary"
              >
                XLSX
              </button>
              <button
                type="button"
                onClick={() => exportRef.current?.('csv')}
                className="panel-no-drag min-h-6 uppercase hover:text-primary"
              >
                CSV
              </button>
            </>
          )}
        </>
      }
      bodyClassName="flex flex-col"
    >
      <QueryView query={sessions}>
        {(data) => (
          <>
            <div className="min-h-0 flex-1">
              <DataTable
                data={data.items}
                columns={columns}
                getRowId={(row) => row.session}
                exportName={`${profile.code}-sessions`}
                exportRef={exportRef}
                emptyMessage={t('sessions.none')}
              />
            </div>
            <div className="grid gap-0.5 border-t px-2 py-1.5 font-sans text-caption text-secondary">
              <p>
                {fixing ? t('sessions.fixingNote') : t('sessions.closeNote')}{' '}
                {data.lastWithoutTrades
                  ? t('sessions.untraded', { date: format.isoDate(data.lastWithoutTrades) })
                  : t('sessions.allTraded')}
              </p>
              <Link
                to={securityPath(profile.id, 'gp')}
                className="self-start text-info hover:underline"
              >
                {t('sessions.history')}
              </Link>
            </div>
          </>
        )}
      </QueryView>
    </Panel>
  )
}
