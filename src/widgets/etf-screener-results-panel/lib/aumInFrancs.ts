import type { XafCrossesDto } from '@/shared/api/contracts'

/**
 * A fund's AUM in francs, for the column's order: each fund writes its AUM in its trading currency,
 * and €84.6 bn sorted after $89.3 bn by the number alone (B64). The euro at the parity, the others
 * at the day's reference rates; a currency without a rate keeps its number.
 */
export function aumInFrancs(
  aum: number | null,
  currency: string,
  crosses: XafCrossesDto | undefined,
): number | undefined {
  if (aum === null) return undefined
  if (currency === 'XAF' || currency === 'XOF') return aum
  if (currency === 'EUR') return aum * (crosses?.parity ?? EURO_PARITY)
  const cross = crosses?.crosses.find((candidate) => candidate.currency === currency)
  return cross ? (aum * cross.xaf) / cross.unit : aum
}

/** 1 EUR = 655.957 XAF, the fixed parity. */
const EURO_PARITY = 655.957
