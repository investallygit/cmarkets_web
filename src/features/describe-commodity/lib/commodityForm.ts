import type {
  CommodityProfileDto,
  CommodityRelatedDto,
  CommodityWriteDto,
} from '@/shared/api/contracts'

/** The CEMAC states a commodity may weigh on, in the order of the reference data. */
export const CEMAC_COUNTRIES = ['CM', 'GA', 'CG', 'GQ', 'TD', 'CF'] as const

/** The related securities a profile lists at most (spec section 9: "related securities (bonds, equities)"). */
export const MAX_RELATED_SECURITIES = 10

/** A description's length at most, as a security's (CORR). */
export const COMMODITY_TEXT_MAX_LENGTH = 2_000

/** The form's starting values: what the profile and its CEMAC links hold. */
export function initialCommodityForm(
  profile: CommodityProfileDto,
  related: CommodityRelatedDto,
): CommodityWriteDto {
  return {
    nameEn: profile.nameEn,
    nameFr: profile.nameFr,
    shortNameEn: profile.shortNameEn,
    shortNameFr: profile.shortNameFr,
    descriptionEn:
      profile.description.en?.source === 'dataAdmin' ? profile.description.en.text : '',
    descriptionFr:
      profile.description.fr?.source === 'dataAdmin' ? profile.description.fr.text : '',
    countries: [...related.countries],
    securityIds: related.securities.map((security) => security.id),
  }
}

/** The names a commodity must keep: 80 characters a name, 32 a list name, none empty. */
export function namesValid(form: CommodityWriteDto): boolean {
  const fits = (text: string, max: number) => text.trim().length > 0 && text.trim().length <= max
  return (
    fits(form.nameEn, 80) &&
    fits(form.nameFr, 80) &&
    fits(form.shortNameEn, 32) &&
    fits(form.shortNameFr, 32)
  )
}

/**
 * A country ticked or not: the others keep their order (Brent's, the mockup's, by exposure), a new
 * one comes last.
 */
export function toggleCountry(countries: readonly string[], country: string): string[] {
  return countries.includes(country)
    ? countries.filter((code) => code !== country)
    : [...countries, country]
}
