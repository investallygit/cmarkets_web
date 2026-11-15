import type { DailyReportStatus } from '@/shared/api/contracts'
import type { BadgeTone } from '@/shared/ui/Badge'

/**
 * The mockup's colours: "Scheduled" blue, "Sent" green, "Nil report sent" grey, "Resent" amber;
 * a failed send red, a day skipped grey.
 */
export const REPORT_STATUS_TONES: Readonly<Record<DailyReportStatus, BadgeTone>> = {
  scheduled: 'info',
  sent: 'up',
  nilSent: 'neutral',
  failed: 'down',
  resent: 'warning',
  skipped: 'neutral',
}

/** A day made and sent at least once: Resend rather than Send now. */
export function isMade(status: DailyReportStatus): boolean {
  return status !== 'scheduled' && status !== 'skipped'
}

/** The month of a day, "2026-10" of "2026-10-29". */
export function monthOf(date: string): string {
  return date.slice(0, 7)
}

/** The month before or after: "2026-01" less one is "2025-12". */
export function shiftMonth(month: string, delta: number): string {
  const [year, number] = month.split('-').map(Number) as [number, number]
  const index = year * 12 + (number - 1) + delta
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

/** XAF in millions, as the mockup's "Face M" ("2,150"); a tenth kept below a whole million. */
export function millions(xaf: number, format: (value: number, decimals: number) => string): string {
  const value = xaf / 1_000_000
  return format(value, Number.isInteger(Math.round(value * 10) / 10) ? 0 : 1)
}

/** A fingerprint as the mockup shortens it: "7f3a…c91e". */
export function shortSha(sha256: string): string {
  return sha256.length > 8 ? `${sha256.slice(0, 4)}…${sha256.slice(-4)}` : sha256
}

/** The "Date (yyyyMMdd)" of the file names, as the API writes them. */
export function compactDate(date: string): string {
  return date.replaceAll('-', '')
}
