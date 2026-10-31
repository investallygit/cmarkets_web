import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useCoverage, useImports } from '@/entities/data-import'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { Panel } from '@/shared/ui/Panel'
import { PanelLoading } from '@/shared/ui/StatusViews'
import { CurrentUploadPanel } from '@/widgets/current-upload-panel'
import { EodhdPanel } from '@/widgets/eodhd-panel'
import { SessionCoveragePanel } from '@/widgets/session-coverage-panel'
import { UploadHistoryPanel } from '@/widgets/upload-history-panel'
import { DATA_IMPORT_LAYOUT } from '../config/layout'

/** ?import=new opens the upload form even while another upload waits. */
const NEW_UPLOAD = 'new'

/**
 * IMP, screen 6 (spec sections 9 and 11): the session coverage, the EODHD connector, the current
 * upload and the history. The upload shown is in the URL (?import=); by default the latest one
 * still waiting, or the upload form.
 */
export function DataImportPage() {
  const { t } = useTranslation()
  const [params, updateParams] = useSearchParamsUpdate()
  const requested = params.get('import')
  const coverage = useCoverage()
  const pending = useImports({ status: ['format', 'checks', 'ready', 'rolledBack'], pageSize: 1 })
  const importId =
    requested === NEW_UPLOAD ? null : (requested ?? pending.data?.items[0]?.id ?? null)
  const open = useCallback(
    (id: string | null) =>
      updateParams((current) => withParams(current, { import: id ?? NEW_UPLOAD })),
    [updateParams],
  )
  // The upload chosen by default goes into the URL, so it stays shown once published.
  const waiting = pending.data?.items[0]?.id
  useEffect(() => {
    if (requested === null && pending.isSuccess) open(waiting ?? null)
  }, [requested, pending.isSuccess, waiting, open])
  const deciding = requested === null

  const panels = {
    coverage: <SessionCoveragePanel onOpenImport={open} />,
    eodhd: <EodhdPanel />,
    upload: deciding ? (
      <Panel title={t('panels.newUpload')} code="IMP">
        <PanelLoading />
      </Panel>
    ) : (
      <CurrentUploadPanel
        importId={importId}
        sessionDate={coverage.data?.date ?? null}
        onOpen={open}
      />
    ),
    history: (
      <UploadHistoryPanel
        variant="recent"
        selectedId={importId}
        onOpen={(upload) => open(upload.id)}
      />
    ),
  }
  return <ScreenWorkspace screenId="IMP" defaultLayout={DATA_IMPORT_LAYOUT} panels={panels} />
}
