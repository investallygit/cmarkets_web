import { ScreenWorkspace, type ScreenPanel } from '@/features/workspace-layout'
import { SUBSCRIPTION_LIST_STATUSES, type SubscriptionListStatus } from '@/shared/api/contracts'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import {
  AccountSubscriptionPanel,
  SubscriptionCounters,
  SubscriptionsPanel,
} from '@/widgets/subscription-admin-panels'

/** Screen 14 mockup: the subscriptions on the left, the account's subscription on the right. */
const LAYOUT: readonly ScreenPanel[] = [
  { i: 'subscriptions', name: 'subscriptions', x: 0, y: 0, w: 8, h: 24, minW: 5, minH: 8 },
  { i: 'account', name: 'accountSubscription', x: 8, y: 0, w: 4, h: 24, minW: 3, minH: 8 },
]

const isStatus = (value: string | null): value is SubscriptionListStatus =>
  SUBSCRIPTION_LIST_STATUSES.some((status) => status === value)

/**
 * SUBS (screen 14): the counters over the workspace, the subscriptions of every account and
 * organisation with the account's own. The account shown and the filters are in the URL
 * (/admin/subscriptions?id=…&status=expiringSoon).
 */
export function SubscriptionManagementPage() {
  const [params, updateParams] = useSearchParamsUpdate()
  const accountId = params.get('id')
  const status = params.get('status')
  const set = (values: Record<string, string>) =>
    updateParams((current) => withParams(current, values))

  const panels = {
    subscriptions: <SubscriptionsPanel selectedId={accountId} onSelect={(id) => set({ id })} />,
    account: <AccountSubscriptionPanel accountId={accountId} />,
  }
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-2 pt-2">
        <SubscriptionCounters
          status={isStatus(status) ? status : null}
          onStatus={(value) => set({ status: value ?? '' })}
        />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace screenId="SUBS" defaultLayout={LAYOUT} panels={panels} />
      </div>
    </div>
  )
}
