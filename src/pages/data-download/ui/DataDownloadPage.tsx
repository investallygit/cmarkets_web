import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import {
  defaultSettings,
  isComplete,
  settingsFromSearch,
  useExportCatalog,
  useExportPreview,
} from '@/entities/data-export'
import { useCurrentUser } from '@/entities/session'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { ExportDatasetCode, ExportSettingsDto } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import {
  DatasetsPanel,
  DownloadSettingsPanel,
  ExportPreviewPanel,
  MyDownloadsPanel,
  MyLimitsPanel,
} from '@/widgets/data-download-panels'
import { DATA_DOWNLOAD_LAYOUT } from '../config/layouts'

/**
 * Screen 30, DL (spec section 9, fifth version; ROADMAP step 57): the datasets the profile
 * downloads, the settings of a file and its preview, "My downloads" and "My limits". Each
 * dataset keeps its settings while the user goes from one to another; ?dataset= opens one.
 */
export function DataDownloadPage() {
  const catalog = useExportCatalog()
  return (
    <QueryView query={catalog}>
      {(loaded) => (
        <Workspace
          datasets={loaded.datasets}
          limits={loaded.limits}
          sourcesOff={loaded.sourcesOff}
        />
      )}
    </QueryView>
  )
}

function Workspace({
  datasets,
  limits,
  sourcesOff,
}: {
  sourcesOff: string[]
  datasets: NonNullable<ReturnType<typeof useExportCatalog>['data']>['datasets']
  limits: NonNullable<ReturnType<typeof useExportCatalog>['data']>['limits']
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const me = useCurrentUser()
  const [search, setSearch] = useSearchParams()
  const [edited, setEdited] = useState<Partial<Record<ExportDatasetCode, ExportSettingsDto>>>({})
  const asked = search.get('dataset')
  const dataset = datasets.find((item) => item.dataset === asked) ?? datasets[0]
  // A Download button's settings fill the dataset in until the user changes them.
  const settings = dataset
    ? (edited[dataset.dataset] ??
      settingsFromSearch(
        defaultSettings(dataset, limits, new Date(), locale, me.timeZone),
        dataset,
        search,
      ))
    : null
  const ready = settings && isComplete(settings) ? settings : null
  const debounced = useDebouncedValue(ready, 400)
  const preview = useExportPreview(debounced)

  if (!dataset || !settings) return <PanelEmpty message={t('downloads.mine.none')} />
  const panels = {
    datasets: (
      <DatasetsPanel
        datasets={datasets}
        sourcesOff={sourcesOff}
        selected={dataset.dataset}
        // Another dataset leaves the items a Download button sent.
        onSelect={(code) => setSearch({ dataset: code }, { replace: true })}
      />
    ),
    settings: (
      <DownloadSettingsPanel
        dataset={dataset}
        limits={limits}
        settings={settings}
        onChange={(next) => setEdited((previous) => ({ ...previous, [next.dataset]: next }))}
        preview={debounced ? preview : null}
        ready={ready}
      />
    ),
    preview: <ExportPreviewPanel preview={debounced ? preview : null} />,
    downloads: <MyDownloadsPanel />,
    limits: <MyLimitsPanel limits={limits} />,
  }
  return <ScreenWorkspace screenId="DL" defaultLayout={DATA_DOWNLOAD_LAYOUT} panels={panels} />
}
