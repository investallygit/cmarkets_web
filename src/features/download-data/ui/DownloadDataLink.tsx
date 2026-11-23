import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { downloadSearch, useExportCatalog } from '@/entities/data-export'
import type { ExportDatasetCode } from '@/shared/api/contracts'
import { routes } from '@/shared/routes/paths'

interface DownloadDataLinkProps {
  dataset: ExportDatasetCode
  /** The securities, series, currencies, indices or portfolios the panel shows. */
  items?: readonly string[]
  from?: string
  to?: string
  table?: string
  /** What the panel holds, for screen readers: "SEMC's prices". */
  what: string
}

/**
 * The Download button of a panel (spec section 9, screen 30: "Each relevant screen also carries a
 * Download button (⬇ icon, top right of the panel) that opens the same window with the settings
 * pre-filled"): DL opened on the panel's dataset and items, shown once the catalogue says the
 * profile downloads the dataset. The tables' own XLSX and CSV stay.
 */
export function DownloadDataLink({ dataset, items, from, to, table, what }: DownloadDataLinkProps) {
  const { t } = useTranslation()
  const catalog = useExportCatalog().data
  if (!catalog?.datasets.some((item) => item.dataset === dataset)) return null
  return (
    <Link
      to={`${routes.dataDownload}${downloadSearch(dataset, { items, from, to, table })}`}
      aria-label={t('downloads.buttonOf', { what })}
      title={t('downloads.buttonOf', { what })}
      className="panel-no-drag inline-flex size-6 items-center justify-center text-secondary hover:text-accent-amber"
    >
      <Download aria-hidden className="size-3.5" />
    </Link>
  )
}
