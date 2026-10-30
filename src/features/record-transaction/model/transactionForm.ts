import { isTrade, transactionSecurity, type TransactionDialogRequest } from '@/entities/portfolio'
import type { SecurityType, TransactionInputDto, TransactionType } from '@/shared/api/contracts'

export interface FormSecurity {
  id: string
  code: string
  /** Unknown for a transaction opened for correction, until another security is picked. */
  type: SecurityType | null
  currency?: string
}

export interface TransactionFormState {
  type: TransactionType
  date: string | null
  security: FormSecurity | null
  quantity: number | null
  price: number | null
  fees: number | null
  amount: number | null
  note: string
}

export type TransactionFormField = 'date' | 'security' | 'quantity' | 'price' | 'fees' | 'amount'
export type TransactionFormError =
  'required' | 'positive' | 'wholeNumber' | 'future' | 'securityType'
export type TransactionFormErrors = Partial<Record<TransactionFormField, TransactionFormError>>

/** The fields of the server's 400 errors, as the form names them. */
export const SERVER_FIELDS: Record<string, TransactionFormField | 'note' | 'type'> = {
  type: 'type',
  date: 'date',
  securityId: 'security',
  quantity: 'quantity',
  price: 'price',
  fees: 'fees',
  amount: 'amount',
  note: 'note',
}

/** A new transaction on today's date, or the one to correct; amounts are typed positive. */
export function initialTransactionForm(
  request: TransactionDialogRequest,
  today: string,
): TransactionFormState {
  const { transaction, preset } = request
  if (transaction) {
    return {
      type: transaction.type,
      date: transaction.date,
      security: transaction.securityId
        ? {
            id: transaction.securityId,
            code: transaction.securityCode ?? transaction.securityId,
            type: null,
          }
        : null,
      quantity: transaction.quantity,
      price: transaction.price,
      fees: isTrade(transaction.type) ? transaction.fees : null,
      amount: isTrade(transaction.type) ? null : Math.abs(transaction.amount),
      note: transaction.note,
    }
  }
  return {
    type: preset?.type ?? 'buy',
    date: today,
    security: preset?.security ?? null,
    quantity: preset?.quantity ?? null,
    price: preset?.price ?? null,
    fees: null,
    amount: null,
    note: '',
  }
}

export function validateTransactionForm(
  form: TransactionFormState,
  today: string,
): TransactionFormErrors {
  const errors: TransactionFormErrors = {}
  if (!form.date) errors.date = 'required'
  else if (form.date > today) errors.date = 'future'
  const rule = transactionSecurity(form.type)
  if (rule?.required && !form.security) errors.security = 'required'
  else if (rule && form.security?.type && !rule.types.includes(form.security.type)) {
    errors.security = 'securityType'
  }
  if (isTrade(form.type)) {
    if (form.quantity === null) errors.quantity = 'required'
    else if (form.quantity <= 0) errors.quantity = 'positive'
    else if (!Number.isInteger(form.quantity)) errors.quantity = 'wholeNumber'
    if (form.price === null) errors.price = 'required'
    else if (form.price <= 0) errors.price = 'positive'
    if (form.fees !== null && form.fees < 0) errors.fees = 'positive'
  } else if (form.amount === null) errors.amount = 'required'
  else if (form.amount <= 0) errors.amount = 'positive'
  return errors
}

/** The body of POST or PUT .../transactions, the fields of the type only; call it without errors. */
export function toTransactionInput(
  form: TransactionFormState,
  version?: string,
): TransactionInputDto {
  const trade = isTrade(form.type)
  return {
    type: form.type,
    date: form.date ?? '',
    securityId: transactionSecurity(form.type) ? (form.security?.id ?? null) : null,
    quantity: trade ? form.quantity : null,
    price: trade ? form.price : null,
    fees: trade ? (form.fees ?? 0) : null,
    amount: trade ? null : form.amount,
    note: form.note.trim(),
    ...(version === undefined ? {} : { version }),
  }
}

/**
 * Cash effect of a share trade, fees included: negative for a purchase. Null for a bond, whose
 * accrued interest the server adds, and while the form is incomplete.
 */
export function estimatedAmount(form: TransactionFormState): number | null {
  if (!isTrade(form.type) || form.security?.type !== 'equity') return null
  if (form.quantity === null || form.price === null) return null
  const gross = form.quantity * form.price
  const fees = form.fees ?? 0
  return form.type === 'sell' ? gross - fees : -(gross + fees)
}
