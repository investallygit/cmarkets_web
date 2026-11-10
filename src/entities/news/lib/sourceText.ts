/** "Media I" → "MI", "CMarket" → "CM": the first letters of its first two words, for a missing logo. */
export function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  const letters =
    words.length > 1 ? words.slice(0, 2).map((word) => word[0]) : [...name.slice(0, 2)]
  return letters.join('').toUpperCase()
}

/** "https://daily-z.example/article/12345" → "daily-z.example/article/12345": the original link, read. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}
