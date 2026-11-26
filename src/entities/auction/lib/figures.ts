/** The tone of a figure of AUC: green, red or plain. */
export type AuctionTone = 'up' | 'down' | 'neutral'

/** Cover = amount bid / amount offered, in percent (screen 33: "a cover below 100% shows in red"). */
export function coverPercent(ratio: number): number {
  return Math.round(ratio * 100)
}

export function coverTone(ratio: number): AuctionTone {
  return ratio < 1 ? 'down' : 'up'
}

/** A rate's change from the previous auction of the same security: higher red, lower green. */
export function changeTone(bp: number | null): AuctionTone {
  if (bp === null || bp === 0) return 'neutral'
  return bp > 0 ? 'down' : 'up'
}

/** "+4 bp", "−2 bp", "0 bp"; an empty string without a previous auction. */
export function formatChangeBp(bp: number | null, unit: string): string {
  if (bp === null) return ''
  const sign = bp > 0 ? '+' : bp < 0 ? '−' : ''
  return `${sign}${Math.abs(bp)} ${unit}`
}

/** "52W" for a 52-week BTA, "5Y" for a 5-year OTA: the tenor of the rates' query. */
export function tenorOf(instrument: 'BTA' | 'OTA', term: number): string {
  return `${term}${instrument === 'BTA' ? 'W' : 'Y'}`
}
