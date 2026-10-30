import { create } from 'zustand'
import type {
  PortfolioDto,
  SecurityType,
  TransactionDto,
  TransactionType,
} from '@/shared/api/contracts'

/** A transaction to correct, or a new one, possibly filled in ("Sell" on a line). */
export interface TransactionDialogRequest {
  portfolioId: string
  transaction?: TransactionDto
  preset?: {
    type?: TransactionType
    security?: { id: string; code: string; type: SecurityType }
    quantity?: number
    price?: number
  }
}

interface TransactionDialogState {
  request: TransactionDialogRequest | null
  close: () => void
}

/**
 * The transaction side form, opened from the header, a line of the positions or the history.
 * The portfolio screen shows the form; this store only says what to show.
 */
export const useTransactionDialog = create<TransactionDialogState>()((set) => ({
  request: null,
  close: () => set({ request: null }),
}))

export function openTransactionDialog(request: TransactionDialogRequest): void {
  useTransactionDialog.setState({ request })
}

export type PortfolioDialogRequest = { mode: 'create' } | { mode: 'edit'; portfolio: PortfolioDto }

interface PortfolioDialogState {
  request: PortfolioDialogRequest | null
  close: () => void
}

/** The portfolio form (new portfolio, settings), opened from the selector or a limit. */
export const usePortfolioDialog = create<PortfolioDialogState>()((set) => ({
  request: null,
  close: () => set({ request: null }),
}))

export function openPortfolioDialog(request: PortfolioDialogRequest): void {
  usePortfolioDialog.setState({ request })
}
