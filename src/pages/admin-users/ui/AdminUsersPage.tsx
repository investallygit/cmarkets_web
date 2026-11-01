import { useNavigate } from 'react-router'
import { isAccountType } from '@/entities/account'
import { ScreenWorkspace, type ScreenPanel } from '@/features/workspace-layout'
import { moderationPath } from '@/shared/routes/paths'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { AccountCounters } from '@/widgets/account-counters'
import { AccountDetailsPanel } from '@/widgets/account-details-panel'
import { AccountsPanel } from '@/widgets/accounts-panel'
import { PendingRequestsPanel } from '@/widgets/analyst-requests-panel'
import { ModerationQueuePanel } from '@/widgets/moderation-queue-panel'

/** Screen 9 mockup: the accounts and their details, then the requests and the moderation queue. */
const LAYOUT: readonly ScreenPanel[] = [
  { i: 'accounts', name: 'accounts', x: 0, y: 0, w: 8, h: 15, minW: 5, minH: 8 },
  { i: 'details', name: 'accountDetails', x: 8, y: 0, w: 4, h: 15, minW: 3, minH: 8 },
  { i: 'requests', name: 'analystRequests', x: 0, y: 15, w: 6, h: 11, minW: 4, minH: 5 },
  { i: 'moderation', name: 'moderationQueue', x: 6, y: 15, w: 6, h: 11, minW: 4, minH: 5 },
]

/**
 * USER (screen 9): the counters by account type over the workspace, the accounts with their
 * details, the Analyst status requests and the moderation queue. The account shown and the
 * filters are in the URL (/admin/users?id=user-analyst&type=analyst).
 */
export function AdminUsersPage() {
  const navigate = useNavigate()
  const [params, updateParams] = useSearchParamsUpdate()
  const accountId = params.get('id')
  const type = params.get('type')
  const set = (values: Record<string, string>) =>
    updateParams((current) => withParams(current, values))

  const panels = {
    accounts: <AccountsPanel selectedId={accountId} onSelect={(id) => set({ id })} />,
    details: <AccountDetailsPanel accountId={accountId} />,
    requests: <PendingRequestsPanel />,
    moderation: (
      <ModerationQueuePanel
        variant="compact"
        onOpen={(item) => void navigate(moderationPath(item.publicationId))}
      />
    ),
  }
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-2 pt-2">
        <AccountCounters
          selected={isAccountType(type) ? type : null}
          onSelect={(value) => set({ type: value ?? '' })}
        />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace screenId="USER" defaultLayout={LAYOUT} panels={panels} />
      </div>
    </div>
  )
}
