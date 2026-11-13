import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { useMacroNames } from '@/entities/macro'
import type { MacroCountryDto } from '@/shared/api/contracts'

interface CountrySelectorProps {
  countries: readonly MacroCountryDto[] | undefined
  /** The economy the tiles show. */
  selected: string | undefined
  onSelect: (code: string) => void
  /** The latest year of the economy shown, for the note at the end of the bar. */
  latestYear: number | null | undefined
}

/**
 * Screen 25's country bar (spec section 9): the CEMAC's six, Sub-Saharan Africa, the Admin's
 * comparison countries and the World, each by its World Bank code and short name; the one shown
 * pressed. "Annual World Bank data · latest year" at its end. API /macro/countries.
 */
export function CountrySelector({
  countries,
  selected,
  onSelect,
  latestYear,
}: CountrySelectorProps) {
  const { t } = useTranslation()
  const names = useMacroNames()

  return (
    <div
      role="group"
      aria-label={t('eco.country')}
      className="flex flex-wrap items-center gap-1 border bg-panel px-2 py-1"
    >
      <span className="pr-1 font-sans text-data text-secondary">{t('eco.country')}</span>
      {countries?.map((country) => {
        const pressed = country.code === selected
        return (
          <button
            key={country.code}
            type="button"
            aria-pressed={pressed}
            title={names.economy(country)}
            onClick={() => onSelect(country.code)}
            className={clsx(
              'inline-flex min-h-6 items-center gap-1.5 border px-2 font-sans text-data',
              pressed
                ? 'border-accent-amber bg-accent-amber/10 text-primary'
                : 'border-transparent text-secondary hover:border-border hover:text-primary',
            )}
          >
            <span className={clsx('font-mono', pressed ? 'text-accent-amber' : 'text-primary')}>
              {country.code}
            </span>
            {names.economy(country, true)}
          </button>
        )
      })}
      <span className="ml-auto font-sans text-data text-accent-amber">
        {latestYear ? t('eco.latestYear', { year: latestYear }) : t('eco.annualData')}
      </span>
    </div>
  )
}
