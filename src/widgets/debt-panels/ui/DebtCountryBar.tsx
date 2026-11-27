import { clsx } from 'clsx'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DEBT_COUNTRIES } from '@/entities/debt'
import { useFormat } from '@/shared/i18n'
import { useDebtCountryName } from '../lib/names'

interface DebtCountryBarProps {
  /** The country shown, by its three letters, or CEMAC. */
  selected: string
  onSelect: (code: string) => void
  /** The day the outstanding is worked out on; none while it loads. */
  asOf: string | undefined
  /** Downloads the securities of the country shown; none while they load. */
  onDownload: (() => void) | undefined
}

/**
 * DEBT's country bar (screen 35, sixth version): the six states by their three letters and short
 * names, then the CEMAC as a whole; the one shown pressed. "Outstanding at …" and Download at its
 * end, as the mockup.
 */
export function DebtCountryBar({ selected, onSelect, asOf, onDownload }: DebtCountryBarProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const name = useDebtCountryName()
  return (
    <div
      role="group"
      aria-label={t('debt.country')}
      className="flex flex-wrap items-center gap-1 border bg-panel px-2 py-1"
    >
      <span className="pr-1 font-sans text-data text-secondary">{t('debt.country')}</span>
      {DEBT_COUNTRIES.map(({ code, country }) => {
        const pressed = code === selected
        return (
          <button
            key={code}
            type="button"
            aria-pressed={pressed}
            onClick={() => onSelect(code)}
            className={clsx(
              'inline-flex min-h-6 items-center gap-1.5 border px-2 font-sans text-data',
              pressed
                ? 'border-accent-amber bg-accent-amber/10 text-primary'
                : 'border-transparent text-secondary hover:border-border hover:text-primary',
            )}
          >
            <span className={clsx('font-mono', pressed ? 'text-accent-amber' : 'text-primary')}>
              {code}
            </span>
            {country ? format.country(country) : t('debt.all')}
          </button>
        )
      })}
      <span className="ml-auto inline-flex items-center gap-2 font-sans text-data text-info">
        {asOf && <span>{t('debt.asOf', { date: format.isoDate(asOf) })}</span>}
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            aria-label={t('debt.downloadLabel', { country: name(selected) })}
            className="inline-flex min-h-6 items-center gap-1 hover:text-primary hover:underline"
          >
            <Download aria-hidden className="size-3.5" />
            {t('debt.download')}
          </button>
        )}
      </span>
    </div>
  )
}
