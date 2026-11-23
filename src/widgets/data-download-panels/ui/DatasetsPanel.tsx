import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { ExportDatasetCode, ExportDatasetDto } from '@/shared/api/contracts'
import { Panel } from '@/shared/ui/Panel'

interface DatasetsPanelProps {
  datasets: readonly ExportDatasetDto[]
  /** The sources the Admin keeps on the screens only. */
  sourcesOff: readonly string[]
  selected: ExportDatasetCode | null
  onSelect: (dataset: ExportDatasetCode) => void
}

/**
 * DL's "Datasets" (spec section 9, screen 30): those the profile downloads, each with what it
 * holds and the codes of the screens whose Download button opens it.
 */
export function DatasetsPanel({ datasets, sourcesOff, selected, onSelect }: DatasetsPanelProps) {
  const { t } = useTranslation()
  return (
    <Panel title={t('panels.exportDatasets')} code="DL" bodyClassName="flex flex-col">
      <ul className="min-h-0 flex-1" aria-label={t('panels.exportDatasets')}>
        {datasets.map((item) => (
          <li key={item.dataset} className="border-b">
            <button
              type="button"
              aria-pressed={item.dataset === selected}
              onClick={() => onSelect(item.dataset)}
              className={clsx(
                'grid w-full grid-cols-[1fr_auto] gap-x-2 px-3 py-2.5 text-left hover:bg-panel-header',
                item.dataset === selected && 'border-l-2 border-accent-amber bg-panel-header',
              )}
            >
              <span
                className={clsx(
                  'font-sans text-label font-semibold',
                  item.dataset === selected && 'text-accent-amber',
                )}
              >
                {t(`downloads.datasets.${item.dataset}.name`)}
              </span>
              <span className="font-mono text-caption text-secondary">
                {item.screens.slice(0, 2).join(' · ')}
              </span>
              <span className="col-span-2 font-sans text-caption text-secondary">
                {t(`downloads.datasets.${item.dataset}.description`)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {sourcesOff.length > 0 && (
        <p className="shrink-0 px-3 py-2 font-sans text-caption text-accent-amber">
          {t('downloads.sourcesOff', {
            sources: sourcesOff
              .map((source) =>
                t(`downloads.sources.${source as 'eodhd'}`, { defaultValue: source }),
              )
              .join(', '),
          })}
        </p>
      )}
      <p className="shrink-0 px-3 py-2 font-sans text-caption text-secondary">
        {t('downloads.datasetsNote')}
      </p>
    </Panel>
  )
}
