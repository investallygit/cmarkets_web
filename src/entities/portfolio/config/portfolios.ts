import type {
  PortfolioLimit,
  PortfolioLimitsDto,
  SecurityType,
  TransactionType,
} from '@/shared/api/contracts'

/** Reference currencies: EUR is pegged to XAF at 655.957. */
export const PORTFOLIO_CURRENCIES = ['XAF', 'EUR'] as const

/** In the order of the form and of the risk metrics. */
export const PORTFOLIO_LIMITS: readonly PortfolioLimit[] = [
  'issuerWeightPct',
  'volatilityPct',
  'drawdownPct',
  'beta',
  'durationYears',
]

export const NO_LIMITS: PortfolioLimitsDto = {
  issuerWeightPct: null,
  volatilityPct: null,
  drawdownPct: null,
  beta: null,
  durationYears: null,
}

/** The nine types of spec section 4, in the order of the form. */
export const TRANSACTION_TYPES: readonly TransactionType[] = [
  'buy',
  'sell',
  'subscription',
  'redemption',
  'dividend',
  'coupon',
  'fees',
  'deposit',
  'withdrawal',
]

/** A buy, a sale or a subscription carries a quantity and a price; the others an amount. */
export function isTrade(type: TransactionType): boolean {
  return type === 'buy' || type === 'sell' || type === 'subscription'
}

/**
 * The securities a type is about: any for a trade, a share for a dividend, a bond for a coupon or
 * a redemption, possibly one for fees, none for a deposit or a withdrawal.
 */
export function transactionSecurity(
  type: TransactionType,
): { required: boolean; types: readonly SecurityType[] } | null {
  switch (type) {
    case 'buy':
    case 'sell':
    case 'subscription':
      return { required: true, types: ['equity', 'bond'] }
    case 'dividend':
      return { required: true, types: ['equity'] }
    case 'coupon':
    case 'redemption':
      return { required: true, types: ['bond'] }
    case 'fees':
      return { required: false, types: ['equity', 'bond'] }
    case 'deposit':
    case 'withdrawal':
      return null
  }
}

/** Columns of the import template, as the server reads them (spec section 4). */
export const IMPORT_TEMPLATE_COLUMNS = [
  'date',
  'type',
  'security',
  'quantity',
  'price',
  'fees',
  'amount',
  'note',
] as const
