import { useContext, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useIndexProfile, useIndexSessions } from '@/entities/market'
import type { IndexSessionDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { indexPath } from '@/shared/routes/paths'
import { ChangeText } from '@/shared/ui/ChangeText'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable, type TableExporter } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { TableExportContext } from '@/shared/ui/tableExport'
import { DownloadDataLink } from '@/features/download-data'

const helper = createDataColumnHelper<IndexSessionDto>()

/** The sessions the panel offers (spec section 9, screen 31): 10, 20 or 60, 20 first. */
const COUNTS = ['10', '20', '60'] as const
type Count = (typeof COUNTS)[number]

/**
 * Screen 31, "Values of recent sessions" (spec section 9, fifth version): each session's value,
 * its change in points and in percent, the constituents' capitalisation in billions; 10, 20 or 60
 * sessions; XLSX and CSV. One value a session, after the fixing. API /indices/{code}/sessions.
 */
export function IndexSessionsPanel({ code }: { code: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const canExport = useContext(TableExportContext)
  const exportRef = useRef<TableExporter | null>(null)
  const [count, setCount] = useState<Count>('20')
  const sessions = useIndexSessions(code, Number(count))
  const fromFile = useIndexProfile(code).data?.source === 'file'

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('session', {
          header: t('indexProfile.sessions.session'),
          cell: ({ getValue }) => format.isoDate(getValue()),
        }),
        helper.accessor('value', {
          header: t('indexProfile.sessions.value'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 2),
        }),
        helper.accessor('change', {
          header: t('indexProfile.sessions.change'),
          meta: { align: 'right' },
          cell: ({ getValue }) => <ChangeText value={getValue()} decimals={2} />,
        }),
        helper.accessor('changePct', {
          header: t('indexProfile.sessions.changePct'),
          meta: { align: 'right' },
          cell: ({ getValue }) => <ChangeText value={getValue()} percent />,
        }),
        helper.accessor('marketCapBn', {
          header: t('indexProfile.sessions.marketCap'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 1),
        }),
      ]),
    [t, format],
  )

  return (
    <Panel
      title={t('panels.indexSessions')}
      code="DES"
      options={
        <>
          <DownloadDataLink dataset="indices" items={[code]} what={code} />
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
                exportName={`${code}-sessions`}
                exportRef={exportRef}
                emptyMessage={t('indexProfile.sessions.none')}
              />
            </div>
            <div className="grid gap-0.5 border-t px-2 py-1.5 font-sans text-caption text-secondary">
              <p>
                {fromFile ? t('indexProfile.sessions.fileNote') : t('indexProfile.sessions.note')}
              </p>
              <Link to={indexPath(code, 'gp')} className="self-start text-info hover:underline">
                {t('indexProfile.sessions.history')}
              </Link>
            </div>
          </>
        )}
      </QueryView>
    </Panel>
  )
}
