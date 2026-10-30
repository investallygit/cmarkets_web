/**
 * The first session of every few months, for the date axis of a series of daily points: monthly
 * up to half a year, quarterly up to two years, then half-yearly and yearly.
 */
export function monthTicks(dates: readonly string[]): string[] {
  const first = dates.at(0)
  const last = dates.at(-1)
  if (!first || !last) return []
  const months =
    (Number(last.slice(0, 4)) - Number(first.slice(0, 4))) * 12 +
    Number(last.slice(5, 7)) -
    Number(first.slice(5, 7))
  const step = months <= 6 ? 1 : months <= 24 ? 3 : months <= 48 ? 6 : 12
  const ticks: string[] = []
  let month = ''
  for (const date of dates) {
    const current = date.slice(0, 7)
    if (current === month) continue
    month = current
    if ((Number(date.slice(5, 7)) - 1) % step === 0) ticks.push(date)
  }
  return ticks
}
