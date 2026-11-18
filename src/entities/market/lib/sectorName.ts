import { useCallback, useMemo } from 'react'
import type { SectorDto } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import type { Locale } from '@/shared/lib/format'
import { useSectors } from '../api/queries'

/**
 * A sector's name in the page's language (B17 of ROADMAP step 50: a French page read "Sovereign",
 * "Banking"): the lists send its English name or its code; CMarket.Api keeps its French name.
 */
export function sectorNameOf(
  sectors: readonly SectorDto[] | undefined,
  name: string,
  locale: Locale,
): string {
  if (locale !== 'fr') return name
  return sectors?.find((sector) => sector.name === name || sector.code === name)?.nameFr ?? name
}

/** sectorNameOf with the sectors of the session and the page's language. */
export function useSectorName(): (name: string) => string {
  const locale = useLocale()
  const sectors = useSectors().data
  const french = useMemo(
    () =>
      new Map(
        sectors?.flatMap((sector) => [
          [sector.name, sector.nameFr],
          [sector.code, sector.nameFr],
        ]),
      ),
    [sectors],
  )
  return useCallback(
    (name) => (locale === 'fr' ? (french.get(name) ?? name) : name),
    [french, locale],
  )
}
