import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { hasIndexProfile } from '@/entities/market'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { IndexFunction } from '@/shared/api/contracts'
import { indexPath, isIndexFunction } from '@/shared/routes/paths'
import { ScreenTabs } from '@/shared/ui/ScreenTabs'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import {
  IndexConstituentsPanel,
  IndexDocumentsPanel,
  IndexDocumentViewer,
  IndexPerformancePanel,
  IndexProfileHeader,
  IndexReturnsPanel,
  IndexSessionsPanel,
  IndexValuePanel,
} from '@/widgets/index-profile-panels'
import { SecurityDescriptionPanel } from '@/widgets/security-description-panel'
import { INDEX_LAYOUTS, indexLayoutKey } from '../config/layouts'

/** Command bar code of each tab (spec section 9, screen 31). */
const TAB_CODES: Record<IndexFunction, string> = {
  des: 'DES',
  gp: 'GP',
  memb: 'MEMB',
  perf: 'PERF',
  doc: 'DOC',
}

/**
 * Screen 31, the index profile (spec section 9, fifth version; ROADMAP step 56): "BVMAC-A DES", a
 * double click on an index of MKT or of the ticker. The header, the tabs DES Profile, GP Chart,
 * MEMB Constituents, PERF Performance and DOC Methodology, then the panels of the tab.
 * /indices/{code}/{tab}; ?doc= opens a document in DOC.
 */
export function IndexProfilePage() {
  const { t } = useTranslation()
  const { code = '', fn } = useParams()
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const indexCode = code.toUpperCase()

  if (!isIndexFunction(fn)) return <Navigate to={indexPath(indexCode)} replace />
  if (!hasIndexProfile(indexCode))
    return <PanelEmpty message={t('indexProfile.noProfile', { code: indexCode })} />
  if (code !== indexCode) return <Navigate to={indexPath(indexCode, fn)} replace />

  const documentId = search.get('doc')
  const openDocument = (id: string) =>
    void navigate(`${indexPath(indexCode, 'doc')}?doc=${encodeURIComponent(id)}`)
  const tabs = (Object.keys(TAB_CODES) as IndexFunction[]).map((tab) => ({
    to: indexPath(indexCode, tab),
    code: TAB_CODES[tab],
    label: t(`indexProfile.tabs.${tab}`),
  }))
  const panels = {
    value: (
      <IndexValuePanel
        code={indexCode}
        periods={
          fn === 'gp' ? ['1M', '3M', '6M', '1Y', '5Y', '10Y'] : ['1M', '3M', '6M', '1Y', '5Y']
        }
        screen={fn === 'gp' ? 'GP' : 'DES'}
      />
    ),
    description: (
      <SecurityDescriptionPanel type="index" id={indexCode} code={indexCode} screen="DES" />
    ),
    sessions: <IndexSessionsPanel code={indexCode} />,
    constituents: (
      <IndexConstituentsPanel code={indexCode} screen={fn === 'memb' ? 'MEMB' : 'DES'} />
    ),
    performance: <IndexPerformancePanel code={indexCode} screen={fn === 'perf' ? 'PERF' : 'DES'} />,
    returns: <IndexReturnsPanel code={indexCode} />,
    documents: <IndexDocumentsPanel code={indexCode} screen="DES" onOpen={openDocument} />,
    list: (
      <IndexDocumentsPanel
        code={indexCode}
        screen="DOC"
        selectedId={documentId}
        onOpen={openDocument}
      />
    ),
    viewer: <IndexDocumentViewer code={indexCode} documentId={documentId} />,
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-2 px-2 pt-2">
        <IndexProfileHeader code={indexCode} />
        <ScreenTabs tabs={tabs} label={t('indexProfile.tabsLabel')} />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace
          key={fn}
          screenId={indexLayoutKey(fn)}
          defaultLayout={INDEX_LAYOUTS[fn]}
          panels={panels}
        />
      </div>
    </div>
  )
}
