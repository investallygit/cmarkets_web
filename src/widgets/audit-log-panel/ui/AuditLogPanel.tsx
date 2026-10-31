import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountPicker, useAccount } from '@/entities/account'
import { AUDIT_ACTION_GROUPS, isAuditAction, useAuditLog, useAuditText } from '@/entities/audit'
import type { AuditAction, AuditEntryDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Select } from '@/shared/ui/form/Select'
import { Pager } from '@/shared/ui/Pager'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<AuditEntryDto>()
const getEntryId = (entry: AuditEntryDto) => entry.id

interface AuditLogPanelProps {
  selectedId: string | null
  onSelect: (entry: AuditEntryDto) => void
}

/**
 * AUDT, the audit log: every action of a Data admin or an Admin, who, what, when, the values
 * before and after (spec section 12), newest first and page by page, filtered by user, action and
 * dates (GET /admin/audit-log). USER opens it with the account filled in; the filters stay in the
 * URL.
 */
export function AuditLogPanel({ selectedId, onSelect }: AuditLogPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const text = useAuditText()
  const [params, updateParams] = useSearchParamsUpdate()
  const [page, setPage] = useState(1)

  const userId = params.get('userId')
  const actionParam = params.get('action')
  const action = isAuditAction(actionParam) ? actionParam : undefined
  const from = params.get('from') ?? undefined
  const to = params.get('to') ?? undefined
  const user = useAccount(userId)
  const log = useAuditLog({ userId: userId ?? undefined, action, from, to, page })
  const setFilter = (values: Record<string, string>) => {
    setPage(1)
    updateParams((current) => withParams(current, values))
  }

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('at', {
          header: t('audit.when'),
          meta: { width: '136px' },
          cell: ({ getValue }) => `${format.date(getValue())} ${format.time(getValue())}`,
        }),
        helper.accessor((entry) => entry.actor.displayName, {
          id: 'who',
          header: t('audit.who'),
          meta: { width: '0.8fr' },
        }),
        helper.accessor((entry) => text.action(entry.action), {
          id: 'action',
          header: t('audit.action'),
          meta: { width: '1.1fr' },
        }),
        helper.accessor((entry) => text.target(entry.target), {
          id: 'target',
          header: t('audit.target'),
          meta: { width: '1.3fr' },
          cell: ({ getValue }) => <span title={getValue()}>{getValue()}</span>,
        }),
        helper.accessor((entry) => entry.changes.map(text.change).join(' ; '), {
          id: 'changes',
          header: t('audit.changes'),
          meta: { width: '1.6fr' },
          cell: ({ getValue }) => <span title={getValue()}>{getValue()}</span>,
        }),
        helper.accessor((entry) => entry.reason ?? '', {
          id: 'reason',
          header: t('form.reason'),
          meta: { width: '1.2fr' },
          cell: ({ getValue }) => (
            <span className="text-secondary" title={getValue()}>
              {getValue()}
            </span>
          ),
        }),
      ]),
    [t, format, text],
  )

  return (
    <Panel title={t('panels.auditLog')} code="AUDT" bodyClassName="flex flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b p-2">
        <AccountPicker
          value={userId ? (user.data?.displayName ?? userId) : null}
          onSelect={(account) => setFilter({ userId: account.id })}
          onClear={() => setFilter({ userId: '' })}
          aria-label={t('audit.user')}
          className="w-64"
        />
        <Select<AuditAction | ''>
          value={action ?? ''}
          prefix={t('audit.actionFilter')}
          aria-label={t('audit.action')}
          options={[
            { value: '', label: t('audit.allActions') },
            ...AUDIT_ACTION_GROUPS.flatMap((group) =>
              group.actions.map((value) => ({
                value,
                label: `${t(group.label)} · ${text.action(value)}`,
              })),
            ),
          ]}
          onChange={(value) => setFilter({ action: value })}
          className="w-72"
        />
        <span className="ml-2 font-sans text-data text-secondary">
          {t('dataImport.history.from')}
        </span>
        <DateInput
          value={from ?? null}
          onChange={(value) => setFilter({ from: value ?? '' })}
          aria-label={t('dataImport.history.from')}
          className="w-28"
        />
        <span className="font-sans text-data text-secondary">{t('dataImport.history.to')}</span>
        <DateInput
          value={to ?? null}
          onChange={(value) => setFilter({ to: value ?? '' })}
          aria-label={t('dataImport.history.to')}
          className="w-28"
        />
      </div>
      <div className="min-h-0 flex-1">
        <QueryView query={log}>
          {(result) => (
            <DataTable
              data={result.items}
              columns={columns}
              getRowId={getEntryId}
              selectedRowId={selectedId}
              onRowClick={onSelect}
              enableSorting={false}
              exportName="cmarket-audit-log"
              emptyMessage={t('audit.none')}
            />
          )}
        </QueryView>
      </div>
      {log.data && (
        <Pager
          page={log.data.page}
          pageSize={log.data.pageSize}
          totalCount={log.data.totalCount}
          onChange={setPage}
        />
      )}
    </Panel>
  )
}
