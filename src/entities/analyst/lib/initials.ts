/** "K. Atangana" -> "KA": the initials in a circle, as on the screen 8 mockup. */
export function initialsOf(name: string): string {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}
