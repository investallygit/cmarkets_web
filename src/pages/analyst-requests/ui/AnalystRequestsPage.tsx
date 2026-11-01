import { useAnalystRequests } from '@/entities/analyst-request'
import { ScreenWorkspace, type ScreenPanel } from '@/features/workspace-layout'
import type { AnalystStatus } from '@/shared/api/contracts'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { AnalystRequestPanel, AnalystRequestsPanel } from '@/widgets/analyst-requests-panel'

/** ANLY is the requests panel of screen 9 in full: the list, then the request and its documents. */
const LAYOUT: readonly ScreenPanel[] = [
  { i: 'requests', name: 'analystRequests', x: 0, y: 0, w: 5, h: 26, minW: 4, minH: 8 },
  { i: 'request', name: 'analystRequest', x: 5, y: 0, w: 7, h: 26, minW: 4, minH: 8 },
]

const STATUSES: readonly AnalystStatus[] = ['pending', 'approved', 'rejected']

/**
 * ANLY: the Analyst status requests waiting, approved or rejected; a click shows the applicant
 * and the supporting documents, with Approve or Reject. In the URL: /admin/analysts?status=&id=.
 */
export function AnalystRequestsPage() {
  const [params, updateParams] = useSearchParamsUpdate()
  const status = STATUSES.find((value) => value === params.get('status')) ?? 'pending'
  const selectedId = params.get('id')
  const requests = useAnalystRequests(status)
  const request = requests.data?.find((candidate) => candidate.id === selectedId) ?? null
  const set = (values: Record<string, string>) =>
    updateParams((current) => withParams(current, values))

  const panels = {
    requests: (
      <AnalystRequestsPanel
        status={status}
        onStatusChange={(value) => set({ status: value === 'pending' ? '' : value, id: '' })}
        selectedId={selectedId}
        onSelect={(selected) => set({ id: selected.id })}
      />
    ),
    request: <AnalystRequestPanel request={request} />,
  }
  return <ScreenWorkspace screenId="ANLY" defaultLayout={LAYOUT} panels={panels} />
}
