/** The time zones DL offers, the profile's first: the extraction time at the top of a file is in it. */
const ZONES = [
  'Africa/Douala',
  'UTC',
  'Europe/Paris',
  'Europe/London',
  'America/New_York',
  'Asia/Tokyo',
]

/** "Douala (GMT+1)": the city and its offset now. */
export function timeZoneLabel(zone: string, now = new Date()): string {
  const city = zone === 'UTC' ? 'UTC' : (zone.split('/').at(-1) ?? zone).replace(/_/g, ' ')
  if (zone === 'UTC') return city
  const offset = new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'shortOffset' })
    .formatToParts(now)
    .find((part) => part.type === 'timeZoneName')?.value
  return offset ? `${city} (${offset})` : city
}

export function timeZoneOptions(current: string, now = new Date()) {
  return [...new Set([current, ...ZONES])].map((zone) => ({
    value: zone,
    label: timeZoneLabel(zone, now),
  }))
}
