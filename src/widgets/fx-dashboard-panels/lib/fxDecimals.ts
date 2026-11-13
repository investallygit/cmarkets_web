/** The parity keeps its three decimals, 655.957, wherever it shows (ROADMAP open question, FX). */
export const PARITY_DECIMALS = 3

/**
 * The ECB's rate as it publishes it, five significant figures: its own decimals, two at least and
 * four at most (1.0848, 163.40, 19.412, 91.25), as the screen 26 mockup writes them.
 */
export function ecbDecimals(rate: number): number {
  const text = String(rate)
  const point = text.indexOf('.')
  return Math.min(4, Math.max(2, point === -1 ? 0 : text.length - point - 1))
}

/**
 * A cross rate or an XAF value as the mockup writes them: two decimals, four below one (0.7717,
 * 0.0015), where two would leave a single figure.
 */
export function crossDecimals(value: number): number {
  return Math.abs(value) < 1 ? 4 : 2
}

/** 1 EUR in XAF, the BEAC's fixed parity, until the API's answer says it. */
export const XAF_PARITY = 655.957
