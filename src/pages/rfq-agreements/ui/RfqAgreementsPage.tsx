import { useMemo } from 'react'
import {
  AGREEMENTS_PAGE_SIZE,
  appliedCount,
  criteriaFromParams,
  pageFromParams,
  paramsWithCriteria,
  sortFromParams,
  sortParam,
} from '@/entities/rfq-agreement'
import { useHasPermission } from '@/entities/session'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { ScreenProps } from '@/shared/routes/screens'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { AgreementDetailPanel } from '@/widgets/rfq-agreement-detail'
import { AgreementFiltersPanel, type AgreementReader } from '@/widgets/rfq-agreement-filters'
import { AgreementListPanel } from '@/widgets/rfq-agreement-list'
import { RfqTabs } from '@/widgets/rfq-tabs'
import { AGREEMENTS_LAYOUT } from '../config/layout'

/**
 * Screen 23, RFQ AGR (spec section 9): the agreements, filtered, sorted and paged, beside the one
 * picked. One page for three readers (ROADMAP decisions 16, 17 and 26): an organisation's Traders,
 * Managers and CEO under RFQ's tabs, an SVT from AGR in its menu, the Admin from its RFQ entry; the
 * API decides what each reads. The filters applied, the order, the page and the agreement picked
 * live in the address, so that a reload or a link shows the same.
 */
export function RfqAgreementsPage({ screenId }: ScreenProps) {
  const admin = useHasPermission('rfq:report')
  const svt = useHasPermission('svt:approve')
  const reader: AgreementReader = admin ? 'admin' : svt ? 'svt' : 'party'
  const [params, updateParams] = useSearchParamsUpdate()
  const criteria = useMemo(() => criteriaFromParams(params), [params])
  const sort = sortFromParams(params)
  const page = pageFromParams(params)
  const selectedId = params.get('agreement')
  const query = { ...criteria, sort: sortParam(sort), page, pageSize: AGREEMENTS_PAGE_SIZE }

  const panels = {
    filters: (
      <AgreementFiltersPanel
        applied={criteria}
        reader={reader}
        onApply={(next) => updateParams((current) => paramsWithCriteria(current, next))}
      />
    ),
    list: (
      <AgreementListPanel
        query={query}
        sort={sort}
        onSortChange={(next) =>
          updateParams((current) => withParams(current, { sort: sortParam(next), page: '' }))
        }
        onPageChange={(next) =>
          updateParams((current) => withParams(current, { page: next > 1 ? String(next) : '' }))
        }
        selectedId={selectedId}
        onSelect={(id) => updateParams((current) => withParams(current, { agreement: id }))}
        bothParties={reader === 'admin'}
        filtered={appliedCount(criteria) > 0}
      />
    ),
    detail: <AgreementDetailPanel id={selectedId} />,
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-2 pt-2 empty:hidden">
        <RfqTabs />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace screenId={screenId} defaultLayout={AGREEMENTS_LAYOUT} panels={panels} />
      </div>
    </div>
  )
}
