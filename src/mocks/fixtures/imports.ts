import type { ImportType, ImportValues } from '@/shared/api/contracts'

/** The two Data admins of the screen 6 mockup. */
export const UPLOADERS = {
  mbarga: { id: 'user-data-admin', name: 'A. Mbarga' },
  ekane: { id: 'user-ekane', name: 'J. Ekane' },
} as const

export type Uploader = (typeof UPLOADERS)[keyof typeof UPLOADERS]

/**
 * The uploads of the screen 6 mockup, by session before the latest one (0) and time in Douala.
 * Daily prices and indices come every session; the curves on Fridays.
 */
export interface UploadSeed {
  type: ImportType
  sessionsAgo: number
  /** Upload time in Douala, HH:MM; the publication follows two minutes later. */
  at: string
  by: Uploader
  fileName: (day: string) => string
  /** Rolled back, then fixed and published again: "Rolled back, republished". */
  rollback?: { at: string; reason: string }
}

const compact = (day: string) => day.replaceAll('-', '')

// prettier-ignore
export const UPLOAD_SEEDS: UploadSeed[] = [
  { type: 'daily-prices', sessionsAgo: 0, at: '16:40', by: UPLOADERS.mbarga, fileName: (day) => `cours_bvmac_${compact(day)}.csv` },
  { type: 'indices', sessionsAgo: 0, at: '16:43', by: UPLOADERS.mbarga, fileName: (day) => `indices_${compact(day)}.csv` },
  { type: 'corporate-actions', sessionsAgo: 0, at: '11:05', by: UPLOADERS.mbarga, fileName: () => 'ost_safacam_div2026.csv' },
  { type: 'daily-prices', sessionsAgo: 1, at: '16:51', by: UPLOADERS.ekane, fileName: (day) => `cours_bvmac_${compact(day)}.csv`,
    rollback: { at: '17:05', reason: 'SIAT close typed as 18,050 instead of 18,500 in the file.' } },
  { type: 'indices', sessionsAgo: 1, at: '16:58', by: UPLOADERS.ekane, fileName: (day) => `indices_${compact(day)}.csv` },
  { type: 'auctions', sessionsAgo: 1, at: '15:20', by: UPLOADERS.ekane, fileName: (day) => `adjudications_${compact(day)}.xlsx` },
  { type: 'daily-prices', sessionsAgo: 2, at: '16:44', by: UPLOADERS.mbarga, fileName: (day) => `cours_bvmac_${compact(day)}.csv` },
  { type: 'indices', sessionsAgo: 2, at: '16:47', by: UPLOADERS.mbarga, fileName: (day) => `indices_${compact(day)}.csv` },
  { type: 'daily-prices', sessionsAgo: 3, at: '16:38', by: UPLOADERS.mbarga, fileName: (day) => `cours_bvmac_${compact(day)}.csv` },
  { type: 'indices', sessionsAgo: 3, at: '16:41', by: UPLOADERS.mbarga, fileName: (day) => `indices_${compact(day)}.csv` },
  { type: 'daily-prices', sessionsAgo: 4, at: '17:02', by: UPLOADERS.mbarga, fileName: (day) => `cours_bvmac_${compact(day)}.csv` },
  { type: 'indices', sessionsAgo: 4, at: '17:05', by: UPLOADERS.mbarga, fileName: (day) => `indices_${compact(day)}.csv` },
]

/** The weekly curves file, uploaded on Friday evenings. */
export const CURVES_UPLOAD = {
  at: '17:10',
  by: UPLOADERS.mbarga,
  fileName: (day: string) => `courbes_beac_${compact(day)}.csv`,
}

/** The BEAC auctions file being checked in the screen 6 mockup, for the latest session. */
export const PENDING_AUCTIONS = {
  at: '16:55',
  by: UPLOADERS.mbarga,
  fileName: (day: string) => `adjudications_beac_${compact(day)}.xlsx`,
  // prettier-ignore
  rows: [
    { country: 'Cameroon', security: 'BTA 26 wk', offered: 15_000, bids: 24_300, allotted: 15_000, avg_rate: 4.95, marginal_rate: 5.05 },
    { country: 'Cameroon', security: 'OTA 3 yr', offered: 25_000, bids: 31_800, allotted: 25_000, avg_rate: 6.1, marginal_rate: 6.2 },
    // 1.40 point above the previous 13-week BTA of Gabon: the alert of the mockup.
    { country: 'Gabon', security: 'BTA 13 wk', offered: 10_000, bids: 8_200, allotted: 8_200, avg_rate: 7.45, marginal_rate: 7.6 },
    { country: 'Congo', security: 'BTA 52 wk', offered: 12_000, bids: 15_900, allotted: 12_000, avg_rate: 6.45, marginal_rate: 6.55 },
    { country: 'Chad', security: 'BTA 26 wk', offered: 8_000, bids: 9_100, allotted: 8_000, avg_rate: 6.2, marginal_rate: 6.3 },
    { country: 'CAR', security: 'BTA 13 wk', offered: 5_000, bids: 5_400, allotted: 5_000, avg_rate: 6.05, marginal_rate: 6.15 },
  ] satisfies ImportValues[],
}
