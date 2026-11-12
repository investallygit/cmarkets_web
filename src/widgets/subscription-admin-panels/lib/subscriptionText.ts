import {
  EXPIRY_WINDOWS,
  SUBSCRIPTION_LIST_STATUSES,
  SUBSCRIPTION_SORTS,
  type AdminSubscriptionQuery,
  type MemberCountDto,
  type SubscriptionListStatus,
  type SubscriptionSort,
} from '@/shared/api/contracts'

/** The list's order by default, as the spec asks: by expiry, the plans in force first. */
export const DEFAULT_SORT: SubscriptionSort = 'expiry'

/** An organisation's members, the most numerous first: "Manager ×4, CEO ×1". */
export function membersLine(
  members: readonly MemberCountDto[],
  count: (member: MemberCountDto) => string,
): string {
  return members.map(count).join(', ')
}

/** Pages of a list: at least one, so that an empty list reads "page 1 / 1". */
export const pageCount = (total: number, pageSize: number) =>
  Math.max(1, Math.ceil(total / Math.max(1, pageSize)))

const isStatus = (value: string | null): value is SubscriptionListStatus =>
  SUBSCRIPTION_LIST_STATUSES.some((status) => status === value)

const isSort = (value: string): value is SubscriptionSort =>
  SUBSCRIPTION_SORTS.some((sort) => sort === value)

/**
 * The list's filters from the address (/admin/subscriptions?status=expiringSoon&expiry=30): an
 * unknown status, window or column is left out rather than sent.
 */
export function queryOf(params: URLSearchParams, q: string): Omit<AdminSubscriptionQuery, 'page'> {
  const status = params.get('status')
  const expiry = Number(params.get('expiry'))
  const sort = params.get('sort') ?? ''
  return {
    q: q || undefined,
    plan: params.get('plan') || undefined,
    status: isStatus(status) ? status : undefined,
    expiringWithinDays: EXPIRY_WINDOWS.some((days) => days === expiry) ? expiry : undefined,
    sort: isSort(sort.replace(/^-/, '')) ? sort : DEFAULT_SORT,
  }
}

/** The column a sort names, "-" first for a descending order. */
export function sortColumn(sort: string | undefined): { id: SubscriptionSort; desc: boolean } {
  const id = (sort ?? DEFAULT_SORT).replace(/^-/, '')
  return { id: isSort(id) ? id : DEFAULT_SORT, desc: sort?.startsWith('-') === true }
}
