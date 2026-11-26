import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { PanelSelect } from '@/shared/ui/PanelSelect'
import { auctionYears, type AuctionFilters } from '../model/filters'

interface AuctionFilterBarProps {
  filters: AuctionFilters
  onChange: (filters: AuctionFilters) => void
  /** The current year: the period offers it and the two before. */
  currentYear: number
  /** Downloads the results shown, as the table's export does. */
  onDownload?: () => void
}

/**
 * AUC's filters beside its tabs (screen 33 mockup: "Country: all · Type: BTA and OTA · Period:
 * 2026 · Download"): the indicators and the latest results follow them.
 */
export function AuctionFilterBar({
  filters,
  onChange,
  currentYear,
  onDownload,
}: AuctionFilterBarProps) {
  const { t } = useTranslation()
  const format = useFormat()
  return (
    <div
      role="group"
      aria-label={t('auctionMarket.filters.label')}
      className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-data text-info"
    >
      <span className="inline-flex items-center gap-1">
        {t('auctionMarket.filters.country')}:
        <PanelSelect
          value={filters.country}
          options={[
            { value: '', label: t('auctionMarket.filters.allCountries') },
            ...CEMAC_COUNTRIES.map((code) => ({ value: code, label: format.country(code) })),
          ]}
          onChange={(country) => onChange({ ...filters, country })}
          aria-label={t('auctionMarket.filters.country')}
        />
      </span>
      <span className="inline-flex items-center gap-1">
        {t('auctionMarket.filters.type')}:
        <PanelSelect
          value={filters.type}
          options={[
            { value: '' as const, label: t('auctionMarket.filters.allTypes') },
            { value: 'BTA' as const, label: t('auctionMarket.filters.bta') },
            { value: 'OTA' as const, label: t('auctionMarket.filters.ota') },
          ]}
          onChange={(type) => onChange({ ...filters, type })}
          aria-label={t('auctionMarket.filters.type')}
        />
      </span>
      <span className="inline-flex items-center gap-1">
        {t('auctionMarket.filters.period')}:
        <PanelSelect
          value={String(filters.year)}
          options={auctionYears(currentYear).map((year) => ({
            value: String(year),
            label: String(year),
          }))}
          onChange={(year) => onChange({ ...filters, year: Number(year) })}
          aria-label={t('auctionMarket.filters.period')}
        />
      </span>
      {onDownload && (
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex min-h-6 items-center gap-1 hover:underline"
        >
          <Download aria-hidden className="size-3.5" />
          {t('auctionMarket.filters.download')}
        </button>
      )}
    </div>
  )
}
