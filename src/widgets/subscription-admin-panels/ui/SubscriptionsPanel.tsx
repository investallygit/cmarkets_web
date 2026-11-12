import type { SortingState } from '@tanstack/react-table'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SUBSCRIPTION_STATUS_COLORS,
  expiryWarns,
  useAdminPlans,
  useAdminSubscriptions,
  useExportSubscriptions,
} from '@/entities/subscription'
import {
  EXPIRY_WINDOWS,
  SUBSCRIPTION_LIST_STATUSES,
  type AdminSubscriptionRowDto,
  type SubscriptionListStatus,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { saveBlob } from '@/shared/lib/download'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'
import { pageCount, queryOf, sortColumn } from '../lib/subscriptionText'
import { useSubscriptionText } from '../lib/useSubscriptionText'

const helper = createDataColumnHelper<AdminSubscriptionRowDto>()
const getAccountId = (row: AdminSubscriptionRowDto) => row.accountId

interface SubscriptionsPanelProps {
  selectedId: string | null
  onSelect: (accountId: string) => void
}

/**
 * Screen 14, subscriptions (GET /admin/subscriptions): search by name, e-mail or organisation,
 * plan, status and expiry filters, the columns of the mockup sorted by expiry, Export CSV of every
 * row of the filters. A member covered by its organisation's plan reads "via organisation". A
 * click shows the account's subscription.
 */
export function SubscriptionsPanel({ selectedId, onSelect }: SubscriptionsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const [params, updateParams] = useSearchParamsUpdate()
  const [search, setSearch] = useState('')
  const q = useDebouncedValue(search.trim(), 250)
  const plans = useAdminPlans()
  const text = useSubscriptionText(plans.data)
  const exportList = useExportSubscriptions()

  const filters = queryOf(params, q)
  // Back to the first page whenever the filters change, a counter's included.
  const filterKey = JSON.stringify(filters)
  const [paging, setPaging] = useState({ filterKey, page: 1 })
  const page = paging.filterKey === filterKey ? paging.page : 1
  const list = useAdminSubscriptions({ ...filters, page })
  const setFilter = (values: Record<string, string>) =>
    updateParams((current) => withParams(current, values))
  const sort = sortColumn(filters.sort)
  const sorting: SortingState = [{ id: sort.id, desc: sort.desc }]

  // Below about 900 px the list scrolls sideways in its panel, its columns still readable.
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('name', {
          id: 'account',
          header: t('subscriptionAdmin.columns.account'),
          meta: { width: 'minmax(112px, 1.1fr)' },
        }),
        helper.accessor((row) => text.type(row), {
          id: 'type',
          header: t('subscriptionAdmin.columns.type'),
          meta: { width: 'minmax(88px, 0.9fr)' },
          cell: ({ getValue }) => <span className="text-secondary">{getValue()}</span>,
        }),
        helper.accessor((row) => text.plan(row), {
          id: 'plan',
          header: t('subscriptionAdmin.columns.plan'),
          meta: { width: 'minmax(112px, 1.2fr)' },
        }),
        helper.accessor((row) => t(`subscriptionAdmin.statuses.${row.status}`), {
          id: 'status',
          header: t('subscriptionAdmin.columns.status'),
          meta: { width: '124px' },
          cell: ({ row, getValue }) => (
            <span className={SUBSCRIPTION_STATUS_COLORS[row.original.status]}>{getValue()}</span>
          ),
        }),
        helper.accessor('expiresOn', {
          id: 'expiry',
          header: t('subscriptionAdmin.columns.expiry'),
          meta: { width: '88px' },
          cell: ({ row, getValue }) => (
            <span className={clsx(expiryWarns(row.original.status) && 'text-warning')}>
              {format.isoDate(getValue())}
            </span>
          ),
        }),
        helper.accessor((row) => text.lastPayment(row), {
          id: 'lastPayment',
          header: t('subscriptionAdmin.columns.lastPayment'),
          meta: { width: 'minmax(176px, 1.5fr)' },
          cell: ({ getValue }) => <span className="text-secondary">{getValue()}</span>,
        }),
        helper.accessor((row) => row.lastInvoice?.number ?? t('subscriptionAdmin.details.none'), {
          id: 'lastInvoice',
          header: t('subscriptionAdmin.columns.lastInvoice'),
          enableSorting: false,
          meta: { width: '116px' },
          cell: ({ getValue }) => <span className="text-info">{getValue()}</span>,
        }),
        helper.accessor((row) => text.autoRenew(row.autoRenew), {
          id: 'autoRenew',
          header: t('subscriptionAdmin.columns.autoRenew'),
          enableSorting: false,
          meta: { width: '44px' },
          cell: ({ getValue }) => <span className="text-secondary">{getValue()}</span>,
        }),
      ]),
    [t, format, text],
  )

  const exportCsv = () =>
    exportList.mutate(filters, {
      onSuccess: (blob) => saveBlob(blob, 'cmarket-subscriptions.csv'),
      onError: (error) => toast.error(error.message),
    })

  return (
    <Panel
      title={t('panels.subscriptions')}
      code="SUBS"
      options={
        <button
          type="button"
          onClick={exportCsv}
          disabled={exportList.isPending}
          className="panel-no-drag inline-flex items-center gap-1 uppercase hover:text-primary disabled:opacity-50"
        >
          <Download aria-hidden className="size-3" />
          {t('subscriptionAdmin.exportCsv')}
        </button>
      }
      bodyClassName="flex flex-col"
    >
      <div className="flex flex-wrap items-center gap-2 border-b p-2">
        <TextInput
          value={search}
          onChange={setSearch}
          placeholder={t('subscriptionAdmin.searchPlaceholder')}
          aria-label={t('subscriptionAdmin.search')}
          className="min-w-48 flex-1"
        />
        <Select
          value={filters.plan ?? ''}
          prefix={t('subscriptionAdmin.planFilter')}
          aria-label={t('subscriptionAdmin.columns.plan')}
          options={[
            { value: '', label: t('subscriptionAdmin.all') },
            ...(plans.data ?? []).map((plan) => ({ value: plan.id, label: plan.name })),
          ]}
          onChange={(value) => setFilter({ plan: value })}
          className="w-44"
        />
        <Select<SubscriptionListStatus | ''>
          value={filters.status ?? ''}
          prefix={t('subscriptionAdmin.statusFilter')}
          aria-label={t('subscriptionAdmin.columns.status')}
          options={[
            { value: '', label: t('subscriptionAdmin.all') },
            ...SUBSCRIPTION_LIST_STATUSES.map((value) => ({
              value,
              label: t(`subscriptionAdmin.statuses.${value}`),
            })),
          ]}
          onChange={(value) => setFilter({ status: value })}
          className="w-48"
        />
        <Select
          value={filters.expiringWithinDays ? String(filters.expiringWithinDays) : ''}
          prefix={t('subscriptionAdmin.expiryFilter')}
          aria-label={t('subscriptionAdmin.columns.expiry')}
          options={[
            { value: '', label: t('subscriptionAdmin.all') },
            ...EXPIRY_WINDOWS.map((days) => ({
              value: String(days),
              label: t('subscriptionAdmin.withinDays', { count: days }),
            })),
          ]}
          onChange={(value) => setFilter({ expiry: value })}
          className="w-44"
        />
      </div>
      <div className="min-h-0 flex-1">
        <QueryView query={list}>
          {(result) => (
            <DataTable
              data={result.items}
              columns={columns}
              getRowId={getAccountId}
              selectedRowId={selectedId}
              onRowClick={(row) => onSelect(row.accountId)}
              sorting={sorting}
              onSortingChange={(next) => {
                const [first] = next
                setFilter({ sort: first ? `${first.desc ? '-' : ''}${first.id}` : '' })
              }}
              exportName="cmarket-subscriptions"
              emptyMessage={t('subscriptionAdmin.none')}
            />
          )}
        </QueryView>
      </div>
      {list.data && (
        <Footer
          shown={list.data.items.length}
          total={list.data.totalCount}
          page={list.data.page}
          pages={pageCount(list.data.totalCount, list.data.pageSize)}
          sort={t(`subscriptionAdmin.sorts.${sort.id}`)}
          onPage={(value) => setPaging({ filterKey, page: value })}
        />
      )}
    </Panel>
  )
}

interface FooterProps {
  shown: number
  total: number
  page: number
  pages: number
  sort: string
  onPage: (page: number) => void
}

/** "14 of 1,871 subscriptions · page 1 / 134 · sort: expiry date", as the mockup's foot, with the pages. */
function Footer({ shown, total, page, pages, sort, onPage }: FooterProps) {
  const { t } = useTranslation()
  const format = useFormat()
  // 24 px targets (WCAG 2.5.8), as tall as the bar.
  const button = 'flex size-6 items-center justify-center hover:text-primary disabled:opacity-40'
  return (
    <nav
      aria-label={t('pager.label')}
      className="flex h-bar shrink-0 items-center gap-2 border-t px-2 font-mono text-data text-secondary"
    >
      <span className="min-w-0 flex-1 truncate">
        {t('subscriptionAdmin.footer', {
          shown: format.number(shown, 0),
          total: format.number(total, 0),
          page,
          pages,
          sort,
        })}
      </span>
      <button
        type="button"
        className={button}
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        aria-label={t('pager.previous')}
      >
        <ChevronLeft aria-hidden className="size-3.5" />
      </button>
      <button
        type="button"
        className={button}
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        aria-label={t('pager.next')}
      >
        <ChevronRight aria-hidden className="size-3.5" />
      </button>
    </nav>
  )
}
