import { useNavigate } from 'react-router'
import { useCoverage } from '@/entities/data-import'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { dataImportPath } from '@/shared/routes/paths'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { ImportTemplatesPanel } from '@/widgets/import-templates-panel'
import { SessionCoveragePanel } from '@/widgets/session-coverage-panel'
import { UploadHistoryPanel } from '@/widgets/upload-history-panel'
import { DATA_SESSION_LAYOUT } from '../config/layout'

/**
 * DATA: the session coverage of screen 6 for any session (?date=), its uploads, and the file
 * templates. An upload opens on IMP.
 */
export function DataSessionPage() {
  const navigate = useNavigate()
  const [params, updateParams] = useSearchParamsUpdate()
  const date = params.get('date')
  // The uploads follow the session the coverage shows, the current one by default.
  const session = useCoverage(date).data?.date ?? date
  const openImport = (importId: string) => void navigate(dataImportPath(importId))

  const panels = {
    coverage: (
      <SessionCoveragePanel
        date={date}
        onDateChange={(value) => updateParams((current) => withParams(current, { date: value }))}
        onOpenImport={openImport}
      />
    ),
    uploads: (
      <UploadHistoryPanel
        variant="session"
        sessionDate={session}
        onOpen={(upload) => openImport(upload.id)}
      />
    ),
    templates: <ImportTemplatesPanel />,
  }
  return <ScreenWorkspace screenId="DATA" defaultLayout={DATA_SESSION_LAYOUT} panels={panels} />
}
