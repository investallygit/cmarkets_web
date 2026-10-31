import type { SortingState } from '@tanstack/react-table'
import { Download, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AccountStatusText,
  AccountTypeText,
  accountListStatus,
  isAccountType,
  useAccounts,
  useExportAccounts,
  useLoginText,
  type AccountQuery,
} from '@/entities/account'
import { CreateAccountDialog } from '@/features/create-account'
import {
  ACCOUNT_LIST_STATUSES,
  ACCOUNT_TYPES,
  ADMIN_USER_SORTS,
  type AccountListStatus,
  type AdminUserDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { saveBlob } from '@/shared/lib/download'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { Pager } from '@/shared/ui/Pager'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'

const helper = createDataColumnHelper<AdminUserDto>()
const getAccountId = (account: AdminUserDto) => account.id

/** The latest logins first, as in the screen 9 mockup. */
const DEFAULT_SORT = '-lastLoginAt'

const isSort = (id: string) => ADMIN_USER_SORTS.some((sort) => sort === id)

function sortingOf(sort: string): SortingState {
  const id = sort.replace(/^-/, '')
  return isSort(id) ? [{ id, desc: sort.startsWith('-') }] : []
}

interface AccountsPanelProps {
  selectedId: string | null
  onSelect: (accountId: string) => void
}

/**
 * Screen 9, accounts: search by name, e-mail or organisation, type and status filters, server
 * sorting and pages, "+ Create account" and "Export CSV" of every account of the filters
 * (GET /admin/users). A click shows the account's details.
 */
export function AccountsPanel({ selectedId, onSelect }: AccountsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const loginText = useLoginText()
  const [params, updateParams] = useSearchParamsUpdate()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const exportAccounts = useExportAccounts()
  const q = useDebouncedValue(search.trim(), 250)

  const typeParam = params.get('type')
  const statusParam = params.get('status')
  const sort = params.get('sort') ?? DEFAULT_SORT
  const filters: Omit<AccountQuery, 'page' | 'pageSize'> = {
    q: q || undefined,
    type: isAccountType(typeParam) ? typeParam : undefined,
    status: ACCOUNT_LIST_STATUSES.find((status) => status === statusParam),
    sort,
  }
  // Back to the first page whenever the filters change, the type from a counter included.
  const filterKey = JSON.stringify(filters)
  const [paging, setPaging] = useState({ filterKey, page: 1 })
  const page = paging.filterKey === filterKey ? paging.page : 1
  const accounts = useAccounts({ ...filters, page })
  const setFilter = (values: Record<string, string>) =>
    updateParams((current) => withParams(current, values))

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('displayName', {
          id: 'name',
          header: t('settings.profile.name'),
          meta: { width: '1.1fr' },
        }),
        helper.accessor('email', {
          header: t('accounts.email'),
          meta: { width: '1.7fr' },
          cell: ({ getValue }) => <span className="text-secondary">{getValue()}</span>,
        }),
        helper.accessor((account) => t(`accountBadge.${account.accountType}`), {
          id: 'type',
          header: t('columns.type'),
          meta: { width: '0.9fr' },
          cell: ({ row }) => <AccountTypeText type={row.original.accountType} short />,
        }),
        helper.accessor((account) => account.organization?.name ?? t('accounts.independent'), {
          id: 'organization',
          header: t('settings.profile.organization'),
          meta: { width: '1.2fr' },
        }),
        helper.accessor((account) => t(`accounts.statuses.${accountListStatus(account)}`), {
          id: 'status',
          header: t('columns.status'),
          meta: { width: '0.9fr' },
          cell: ({ row }) => <AccountStatusText account={row.original} />,
        }),
        helper.accessor('createdAt', {
          header: t('accounts.joined'),
          meta: { width: '92px' },
          cell: ({ getValue }) => format.date(getValue()),
        }),
        helper.accessor('lastLoginAt', {
          header: t('accounts.lastLoginColumn'),
          meta: { width: '120px' },
          cell: ({ getValue }) => loginText(getValue()),
        }),
      ]),
    [t, format, loginText],
  )

  const exportCsv = () =>
    exportAccounts.mutate(filters, {
      onSuccess: (blob) => saveBlob(blob, 'cmarket-accounts.csv'),
      onError: (error) => toast.error(error.message),
    })

  return (
    <Panel
      title={t('panels.accounts')}
      code="USER"
      options={
        <div className="panel-no-drag flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 uppercase hover:text-primary"
          >
            <Plus aria-hidden className="size-3" />
            {t('accounts.create.action')}
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={exportCsv}
            disabled={exportAccounts.isPending}
            className="inline-flex items-center gap-1 uppercase hover:text-primary disabled:opacity-50"
          >
            <Download aria-hidden className="size-3" />
            {t('accounts.exportCsv')}
          </button>
        </div>
      }
      bodyClassName="flex flex-col"
    >
      <div className="flex flex-wrap items-center gap-2 border-b p-2">
        <TextInput
          value={search}
          onChange={setSearch}
          placeholder={t('accounts.searchPlaceholder')}
          aria-label={t('accounts.search')}
          className="min-w-48 flex-1"
        />
        <Select
          value={filters.type ?? ''}
          prefix={t('accounts.typeFilter')}
          aria-label={t('columns.type')}
          options={[
            { value: '', label: t('accounts.all') },
            ...ACCOUNT_TYPES.map((value) => ({ value, label: t(`accountTypes.${value}`) })),
          ]}
          onChange={(value) => setFilter({ type: value })}
          className="w-52"
        />
        <Select<AccountListStatus | ''>
          value={filters.status ?? ''}
          prefix={t('accounts.statusFilter')}
          aria-label={t('columns.status')}
          options={[
            { value: '', label: t('accounts.all') },
            ...ACCOUNT_LIST_STATUSES.map((value) => ({
              value,
              label: t(`accounts.statuses.${value}`),
            })),
          ]}
          onChange={(value) => setFilter({ status: value })}
          className="w-48"
        />
        {accounts.data && (
          <span className="ml-auto font-mono text-data text-secondary">
            {t('accounts.total', {
              count: accounts.data.totalCount,
              total: format.number(accounts.data.totalCount, 0),
            })}
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <QueryView query={accounts}>
          {(result) => (
            <DataTable
              data={result.items}
              columns={columns}
              getRowId={getAccountId}
              selectedRowId={selectedId}
              onRowClick={(account) => onSelect(account.id)}
              sorting={sortingOf(sort)}
              onSortingChange={(sorting) => {
                const [first] = sorting
                setFilter({ sort: first ? `${first.desc ? '-' : ''}${first.id}` : '' })
              }}
              exportName="cmarket-accounts"
              emptyMessage={t('accounts.none')}
            />
          )}
        </QueryView>
      </div>
      {accounts.data && (
        <Pager
          page={accounts.data.page}
          pageSize={accounts.data.pageSize}
          totalCount={accounts.data.totalCount}
          onChange={(value) => setPaging({ filterKey, page: value })}
        />
      )}
      <CreateAccountDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(account) => {
          setCreating(false)
          onSelect(account.id)
        }}
      />
    </Panel>
  )
}
