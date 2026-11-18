/** A thousand billion: the most the converter asks the API for. */
export const MAX_AMOUNT = 1e15

/** An amount the converter asks for: above 0, finite, within the limit (B49). */
export const isConvertible = (amount: number | null): amount is number =>
  amount !== null && Number.isFinite(amount) && amount > 0 && amount <= MAX_AMOUNT
