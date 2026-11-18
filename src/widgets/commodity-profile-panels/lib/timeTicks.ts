/**
 * The ticks of CMP's time axis, from the dates of its rows: the first date of each year, which the
 * axis labels with its year, so that no year shows twice (B10); over a year or less, the first
 * date of each quarter, labelled with its month. At most `max` ticks: every second year, every
 * fifth… when there are more years.
 */
export function timeTicks(
  dates: readonly string[],
  max = 10,
): { ticks: string[]; byMonth: boolean } {
  if (dates.length === 0) return { ticks: [], byMonth: false }
  const byMonth = dates.at(-1)!.slice(0, 4) !== dates[0].slice(0, 4) ? spanDays(dates) <= 400 : true
  const firsts: string[] = []
  let previous = ''
  for (const date of dates) {
    const key = byMonth ? quarterOf(date) : date.slice(0, 4)
    if (key !== previous) firsts.push(date)
    previous = key
  }
  const step = Math.ceil(firsts.length / max)
  return { ticks: firsts.filter((_, index) => index % step === 0), byMonth }
}

const quarterOf = (date: string) =>
  `${date.slice(0, 4)}-Q${Math.floor((Number(date.slice(5, 7)) - 1) / 3)}`

const spanDays = (dates: readonly string[]) =>
  (Date.parse(dates.at(-1)!) - Date.parse(dates[0])) / 86_400_000
