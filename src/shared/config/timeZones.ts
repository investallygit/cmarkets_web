/**
 * Time zones offered in the profile (CFG): the six CEMAC capitals' first, then the financial
 * centres CMarket users work from. Any IANA zone the server returns is shown as well.
 */
export const TIME_ZONES = [
  'Africa/Douala',
  'Africa/Libreville',
  'Africa/Brazzaville',
  'Africa/Ndjamena',
  'Africa/Bangui',
  'Africa/Malabo',
  'Africa/Lagos',
  'Africa/Abidjan',
  'Africa/Johannesburg',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'Asia/Dubai',
  'UTC',
] as const
