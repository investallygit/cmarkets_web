import {
  CLIENT_ACCOUNT_TYPES,
  type ClientAccountType,
  type ContactMode,
  type ExperienceDto,
  type ProfilePrivacyDto,
} from '@/shared/api/contracts'

/** "K. Atangana" gives "KA", "Mvondo" "MV": the avatar of a profile without a photo. */
export function initialsOf(name: string): string {
  const words = name.split(/[\s.'-]+/).filter(Boolean)
  const initials =
    words.length >= 2 ? `${words[0].charAt(0)}${words.at(-1)?.charAt(0) ?? ''}` : name.slice(0, 2)
  return initials.toLocaleUpperCase()
}

/**
 * The button a viewer of a type sees on the card, for a sender who has no conversation with the
 * user yet: none on a hidden profile, the user's rule for the type otherwise. The server decides
 * for a real contact (GET /profiles/{id}/contact-permission), blocks included.
 */
export function previewContactMode(
  viewer: ClientAccountType,
  privacy: Pick<ProfilePrivacyDto, 'visibility' | 'contactRules'>,
): ContactMode {
  return privacy.visibility === 'hidden' ? 'none' : privacy.contactRules[viewer]
}

/** The client types by the button they see: "Contact: Analyst, Manager...". */
export function typesByMode(
  privacy: Pick<ProfilePrivacyDto, 'visibility' | 'contactRules'>,
): Record<ContactMode, ClientAccountType[]> {
  const groups: Record<ContactMode, ClientAccountType[]> = { direct: [], request: [], none: [] }
  for (const type of CLIENT_ACCOUNT_TYPES) groups[previewContactMode(type, privacy)].push(type)
  return groups
}

/** Positions held to this day first, then by their end, then the certifications. */
export function experiencesInOrder(experiences: readonly ExperienceDto[]): ExperienceDto[] {
  const end = (experience: ExperienceDto) => experience.to ?? Number.POSITIVE_INFINITY
  return [...experiences].sort(
    (a, b) =>
      Number(a.kind === 'certification') - Number(b.kind === 'certification') ||
      end(b) - end(a) ||
      (b.from ?? 0) - (a.from ?? 0),
  )
}
