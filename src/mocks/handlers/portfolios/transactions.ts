import { http, HttpResponse } from 'msw'
import type {
  TransactionDto,
  TransactionImportResultDto,
  TransactionInputDto,
  TransactionType,
} from '@/shared/api/contracts'
import { formatIsoDate } from '@/shared/lib/format'
import { marketData, securities } from '../../db'
import { api, latency, noContent, problem } from '../../lib/http'
import { newId } from '../../lib/ids'
import {
  transactionAmount,
  type MarketData,
  type StoredPortfolio,
  type StoredTransaction,
  type TransactionFields,
} from '../../lib/portfolioEngine'
import { normalize } from '../../lib/text'
import { cellDate, cellNumber, cellText, readTransactionFile } from '../../lib/templateFile'
import { isIsoDate, isNumber } from '../../lib/validation'
import { invalid, savePortfolio, valuationOf, withPortfolio, type Errors } from './common'
import { checkLimits, noteLimits } from './limits'

const MAX_NOTE_LENGTH = 200

const MAX_IMPORT_ROWS = 1000
const MAX_FILE_SIZE = 2 * 1024 * 1024

const TRANSACTION_TYPES: readonly TransactionType[] = [
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

const isTrade = (type: TransactionType) =>
  type === 'buy' || type === 'sell' || type === 'subscription'

function toTransactionDto(
  transaction: StoredTransaction,
  realized: ReadonlyMap<string, number>,
): TransactionDto {
  const security = transaction.securityId ? securities.get(transaction.securityId) : undefined
  return {
    ...transaction,
    securityCode: security?.code ?? null,
    realizedGain: realized.get(transaction.id) ?? null,
    version: String(transaction.version),
  }
}

/** Shares and bonds held never go below zero, sale by sale; the first one that does. */
function oversold(transactions: readonly StoredTransaction[]) {
  const held = new Map<string, number>()
  for (const transaction of [...transactions].sort((a, b) => a.date.localeCompare(b.date))) {
    const { securityId, quantity, type } = transaction
    if (!securityId || !isTrade(type)) continue
    const before = held.get(securityId) ?? 0
    const after = type === 'sell' ? before - (quantity ?? 0) : before + (quantity ?? 0)
    if (after < -1e-9) return { transaction, held: before }
    held.set(securityId, after)
  }
  return null
}

/** What each type needs: a share, a bond, any security, or none. */
function securityRule(type: TransactionType): 'any' | 'equity' | 'bond' | 'optional' | 'none' {
  switch (type) {
    case 'buy':
    case 'sell':
    case 'subscription':
      return 'any'
    case 'dividend':
      return 'equity'
    case 'coupon':
    case 'redemption':
      return 'bond'
    case 'fees':
      return 'optional'
    case 'deposit':
    case 'withdrawal':
      return 'none'
  }
}

/** The fields of a transaction, or its errors by field. */
function readTransaction(
  body: Partial<TransactionInputDto>,
  market: MarketData,
): { fields: TransactionFields & { note: string } } | { errors: Errors } {
  const errors: Errors = {}
  const type = TRANSACTION_TYPES.find((candidate) => candidate === body.type)
  if (!type) return { errors: { type: [`One of ${TRANSACTION_TYPES.join(', ')}.`] } }
  const date = isIsoDate(body.date) ? body.date : ''
  if (!date || date > market.today || date < '2000-01-01') errors.date = ['A date up to today.']

  const rule = securityRule(type)
  const securityId = body.securityId ?? null
  const security = securityId ? market.security(securityId) : undefined
  if (rule === 'none' && securityId) errors.securityId = ['No security for this type.']
  if (rule !== 'none' && rule !== 'optional' && !security)
    errors.securityId = ['A security is required.']
  if (securityId && rule !== 'none' && !security) errors.securityId = ['Unknown security.']
  if (security && rule === 'equity' && security.type !== 'equity') errors.securityId = ['A share.']
  if (security && rule === 'bond' && security.type !== 'bond') errors.securityId = ['A bond.']
  const bond = security ? market.bond(security.id) : undefined
  if (bond && date && date < bond.issueDate) {
    errors.date = [`The bond was issued on ${formatIsoDate(bond.issueDate)}.`]
  }

  const quantity = isTrade(type) ? (body.quantity ?? null) : null
  const price = isTrade(type) ? (body.price ?? null) : null
  const amount = isTrade(type) ? null : (body.amount ?? null)
  const fees = body.fees ?? 0
  if (isTrade(type)) {
    if (!isNumber(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      errors.quantity = ['A whole number above 0.']
    }
    if (!isNumber(price) || price <= 0) errors.price = ['Above 0.']
    if (!isNumber(fees) || fees < 0) errors.fees = ['0 or more.']
  } else if (!isNumber(amount) || amount <= 0) errors.amount = ['Above 0.']
  const note = typeof body.note === 'string' ? body.note.trim() : ''
  if (note.length > MAX_NOTE_LENGTH) errors.note = [`${MAX_NOTE_LENGTH} characters at most.`]

  if (Object.keys(errors).length > 0) return { errors }
  return {
    fields: {
      type,
      date,
      securityId: rule === 'none' ? null : (security?.id ?? null),
      quantity,
      price,
      fees: isTrade(type) ? fees : 0,
      amount,
      note,
    },
  }
}

function storeTransaction(
  fields: TransactionFields & { note: string },
  portfolio: StoredPortfolio,
  market: MarketData,
  id: string,
  version: number,
): StoredTransaction {
  return {
    ...fields,
    id,
    version,
    amount: transactionAmount(fields, portfolio.currency, market),
  }
}

const modelHasNoTransactions = () =>
  problem(409, 'Model portfolio', 'A model portfolio has no transactions: change its allocation.')

/** A security as typed in a file: its code, its id or another name ("ECMR 6.25 2029"). */
function findSecurityId(text: string): string | null {
  const wanted = normalize(text)
  if (!wanted) return null
  for (const security of securities.values()) {
    const names = [security.id, security.code, ...(security.aliases ?? [])]
    if (names.some((name) => normalize(name) === wanted)) return security.id
  }
  return null
}

/**
 * The transactions of a portfolio: recorded, changed, deleted or imported from a file, never
 * selling more than held.
 */
export const transactionHandlers = [
  // A model portfolio has none: its allocation stands for them.
  http.get(api('/portfolios/:id/transactions'), async ({ params }) => {
    await latency()
    const found = withPortfolio('portfolios:read', params.id)
    if ('response' in found) return found.response
    const { portfolio } = found
    if (portfolio.kind === 'model') return HttpResponse.json<TransactionDto[]>([])
    const { realizedById } = valuationOf(portfolio, marketData())
    return HttpResponse.json(
      [...portfolio.transactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((transaction) => toTransactionDto(transaction, realizedById)),
    )
  }),

  http.post(api('/portfolios/:id/transactions'), async ({ params, request }) => {
    await latency()
    const found = withPortfolio('portfolios:write', params.id)
    if ('response' in found) return found.response
    const { portfolios, portfolio } = found
    if (portfolio.kind === 'model') return modelHasNoTransactions()
    const market = marketData()
    const read = readTransaction((await request.json()) as Partial<TransactionInputDto>, market)
    if ('errors' in read) return invalid('Invalid transaction', read.errors)
    const transaction = storeTransaction(read.fields, portfolio, market, newId('tx'), 1)
    const transactions = [...portfolio.transactions, transaction]
    const short = oversold(transactions)
    if (short) {
      return invalid('Invalid transaction', {
        quantity: [
          `${short.held.toLocaleString('en-US')} held on ${formatIsoDate(short.transaction.date)}.`,
        ],
      })
    }
    noteLimits(portfolio, market)
    const updated = { ...portfolio, transactions }
    savePortfolio(portfolios, updated)
    checkLimits(updated, market)
    const { realizedById } = valuationOf(updated, market)
    return HttpResponse.json(toTransactionDto(transaction, realizedById), { status: 201 })
  }),

  http.put(api('/portfolios/:id/transactions/:txId'), async ({ params, request }) => {
    await latency()
    const found = withPortfolio('portfolios:write', params.id)
    if ('response' in found) return found.response
    const { portfolios, portfolio } = found
    if (portfolio.kind === 'model') return modelHasNoTransactions()
    const existing = portfolio.transactions.find((candidate) => candidate.id === params.txId)
    if (!existing)
      return problem(404, 'Transaction not found', `No transaction ${String(params.txId)}.`)
    const body = (await request.json()) as Partial<TransactionInputDto>
    if (body.version !== String(existing.version)) {
      return problem(409, 'Transaction changed', 'Someone else changed this transaction meanwhile.')
    }
    const market = marketData()
    const read = readTransaction(body, market)
    if ('errors' in read) return invalid('Invalid transaction', read.errors)
    const transaction = storeTransaction(
      read.fields,
      portfolio,
      market,
      existing.id,
      existing.version + 1,
    )
    const transactions = portfolio.transactions.map((candidate) =>
      candidate === existing ? transaction : candidate,
    )
    const short = oversold(transactions)
    if (short) {
      const message = `${short.held.toLocaleString('en-US')} held on ${formatIsoDate(short.transaction.date)}.`
      return short.transaction === transaction
        ? invalid('Invalid transaction', { quantity: [message] })
        : problem(409, 'Holdings', `A later sale would sell more than held: ${message}`)
    }
    noteLimits(portfolio, market)
    const updated = { ...portfolio, transactions }
    savePortfolio(portfolios, updated)
    checkLimits(updated, market)
    const { realizedById } = valuationOf(updated, market)
    return HttpResponse.json(toTransactionDto(transaction, realizedById))
  }),

  http.delete(api('/portfolios/:id/transactions/:txId'), async ({ params }) => {
    await latency()
    const found = withPortfolio('portfolios:write', params.id)
    if ('response' in found) return found.response
    const { portfolios, portfolio } = found
    if (portfolio.kind === 'model') return modelHasNoTransactions()
    const transactions = portfolio.transactions.filter((candidate) => candidate.id !== params.txId)
    if (transactions.length === portfolio.transactions.length) {
      return problem(404, 'Transaction not found', `No transaction ${String(params.txId)}.`)
    }
    const short = oversold(transactions)
    if (short) {
      return problem(
        409,
        'Holdings',
        `Without it, the sale of ${formatIsoDate(short.transaction.date)} would sell more than held.`,
      )
    }
    const market = marketData()
    noteLimits(portfolio, market)
    const updated = { ...portfolio, transactions }
    savePortfolio(portfolios, updated)
    checkLimits(updated, market)
    return noContent()
  }),

  // All rows or none, so a file can be fixed and sent again.
  http.post(api('/portfolios/:id/transactions/import'), async ({ params, request }) => {
    await latency()
    const found = withPortfolio('portfolios:write', params.id)
    if ('response' in found) return found.response
    const { portfolios, portfolio } = found
    if (portfolio.kind === 'model') return modelHasNoTransactions()
    const file = (await request.formData()).get('file')
    if (!(file instanceof File)) return invalid('Invalid file', { file: ['A .csv or .xlsx file.'] })
    if (file.size > MAX_FILE_SIZE) return invalid('Invalid file', { file: ['2 MB at most.'] })
    const read = await readTransactionFile(file)
    if ('error' in read) return invalid('Invalid file', { file: [read.error] })
    if (read.rows.length === 0)
      return invalid('Invalid file', { file: ['No transaction in the file.'] })
    if (read.rows.length > MAX_IMPORT_ROWS) {
      return invalid('Invalid file', { file: [`${MAX_IMPORT_ROWS} rows at most.`] })
    }

    const market = marketData()
    const errors: Errors = {}
    const imported: StoredTransaction[] = []
    const lineOf = new Map<StoredTransaction, number>()
    for (const { line, cells } of read.rows) {
      const securityText = cellText(cells.security)
      const securityId = securityText ? findSecurityId(securityText) : null
      const number = (value: number | null) =>
        value === null || Number.isNaN(value) ? null : value
      const parsed = {
        type: cellText(cells.type).toLowerCase() as TransactionType,
        date: cellDate(cells.date) ?? '',
        securityId: securityText && !securityId ? securityText : securityId,
        quantity: number(cellNumber(cells.quantity)),
        price: number(cellNumber(cells.price)),
        fees: number(cellNumber(cells.fees)),
        amount: number(cellNumber(cells.amount)),
        note: cellText(cells.note),
      }
      const result = readTransaction(parsed, market)
      if ('errors' in result) {
        for (const [field, messages] of Object.entries(result.errors)) {
          errors[`rows[${line}].${field === 'securityId' ? 'security' : field}`] = messages
        }
        continue
      }
      const transaction = storeTransaction(result.fields, portfolio, market, newId('tx'), 1)
      imported.push(transaction)
      lineOf.set(transaction, line)
    }
    const short =
      Object.keys(errors).length === 0 ? oversold([...portfolio.transactions, ...imported]) : null
    if (short) {
      const line = lineOf.get(short.transaction)
      errors[line ? `rows[${line}].quantity` : 'file'] = [
        `${short.held.toLocaleString('en-US')} held on ${formatIsoDate(short.transaction.date)}.`,
      ]
    }
    if (Object.keys(errors).length > 0) return invalid('Invalid file', errors)

    noteLimits(portfolio, market)
    const updated = { ...portfolio, transactions: [...portfolio.transactions, ...imported] }
    savePortfolio(portfolios, updated)
    checkLimits(updated, market)
    const dates = imported.map((transaction) => transaction.date).sort()
    return HttpResponse.json<TransactionImportResultDto>(
      { imported: imported.length, from: dates.at(0) ?? null, to: dates.at(-1) ?? null },
      { status: 201 },
    )
  }),
]
