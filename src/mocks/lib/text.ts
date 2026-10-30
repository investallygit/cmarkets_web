/** "Société", "6.25%" -> "SOCIETE", "6.25": accents and percent signs do not matter when typing. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/%/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}
