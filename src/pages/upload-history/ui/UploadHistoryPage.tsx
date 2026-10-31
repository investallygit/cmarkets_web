import { useNavigate } from 'react-router'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { dataImportPath } from '@/shared/routes/paths'
import type { WorkspaceItem } from '@/shared/ui/Workspace'
import { UploadHistoryPanel } from '@/widgets/upload-history-panel'

const LAYOUT: readonly WorkspaceItem[] = [
  { i: 'history', x: 0, y: 0, w: 12, h: 26, minW: 6, minH: 8 },
]

/**
 * HIST: the upload history of screen 6 over any period, filtered by type, status and dates, page
 * by page. An upload opens on IMP; the right-click menu rolls back a publication.
 */
export function UploadHistoryPage() {
  const navigate = useNavigate()
  const panels = {
    history: (
      <UploadHistoryPanel
        variant="full"
        onOpen={(upload) => void navigate(dataImportPath(upload.id))}
      />
    ),
  }
  return <ScreenWorkspace screenId="HIST" defaultLayout={LAYOUT} panels={panels} />
}
