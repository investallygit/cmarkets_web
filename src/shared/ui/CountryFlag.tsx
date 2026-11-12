import { clsx } from 'clsx'
import ch from 'flag-icons/flags/4x3/ch.svg'
import cf from 'flag-icons/flags/4x3/cf.svg'
import cg from 'flag-icons/flags/4x3/cg.svg'
import cm from 'flag-icons/flags/4x3/cm.svg'
import de from 'flag-icons/flags/4x3/de.svg'
import fr from 'flag-icons/flags/4x3/fr.svg'
import ga from 'flag-icons/flags/4x3/ga.svg'
import gb from 'flag-icons/flags/4x3/gb.svg'
import gq from 'flag-icons/flags/4x3/gq.svg'
import ie from 'flag-icons/flags/4x3/ie.svg'
import it from 'flag-icons/flags/4x3/it.svg'
import lu from 'flag-icons/flags/4x3/lu.svg'
import nl from 'flag-icons/flags/4x3/nl.svg'
import td from 'flag-icons/flags/4x3/td.svg'
import us from 'flag-icons/flags/4x3/us.svg'

/**
 * The flags of the countries the platform names (ROADMAP decision 10: flag-icons, MIT, one SVG a
 * country): the CEMAC states, and the countries of the ETFs' listings and domiciles. A few hundred
 * bytes each, the build inlines them.
 */
const FLAGS: Readonly<Record<string, string>> = {
  CF: cf,
  CG: cg,
  CH: ch,
  CM: cm,
  DE: de,
  FR: fr,
  GA: ga,
  GB: gb,
  GQ: gq,
  IE: ie,
  IT: it,
  LU: lu,
  NL: nl,
  TD: td,
  US: us,
}

interface CountryFlagProps {
  /** ISO 3166 code, e.g. "IE". */
  code: string
  /** The country's name, for screen readers and the tooltip. */
  label: string
  className?: string
}

/** A country's flag at 4:3, its name as its text; its code in a box for a country without one. */
export function CountryFlag({ code, label, className }: CountryFlagProps) {
  const flag = FLAGS[code.toUpperCase()]
  if (!flag) {
    return (
      <span
        title={label}
        aria-label={label}
        className={clsx(
          'inline-flex shrink-0 border px-0.5 font-mono text-[10px] leading-3',
          className,
        )}
      >
        {code}
      </span>
    )
  }
  return (
    <img
      src={flag}
      alt={label}
      title={label}
      width={16}
      height={12}
      className={clsx('inline-block h-3 w-4 shrink-0 object-cover', className)}
    />
  )
}
