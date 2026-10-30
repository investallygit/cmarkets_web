/** Amounts of an invoice, in whole francs. */
export interface InvoiceAmounts {
  /** Excluding VAT. */
  amount: number
  taxAmount: number
  total: number
}

/** A price excluding VAT, per user, for several users, then the VAT on top. */
export function amountsFromNet(
  unitPrice: number,
  seats: number,
  taxRatePct: number,
): InvoiceAmounts {
  const amount = unitPrice * seats
  const taxAmount = Math.round((amount * taxRatePct) / 100)
  return { amount, taxAmount, total: amount + taxAmount }
}

/** A price that includes VAT, such as a publication's: the VAT it contains. */
export function amountsFromTotal(total: number, taxRatePct: number): InvoiceAmounts {
  const amount = Math.round(total / (1 + taxRatePct / 100))
  return { amount, taxAmount: total - amount, total }
}

/** What a year costs against twelve months, in percent saved. */
export function yearlySavingPct(monthlyPrice: number, yearlyPrice: number): number {
  return monthlyPrice <= 0 ? 0 : Math.round((1 - yearlyPrice / (12 * monthlyPrice)) * 100)
}
