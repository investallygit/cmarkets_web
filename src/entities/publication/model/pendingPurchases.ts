import { create } from 'zustand'
import type { PaymentDto } from '@/shared/api/contracts'

export interface PendingPurchase {
  payment: PaymentDto
  /** The publication's title, for the toast that says it is the reader's. */
  title: string
}

interface PendingPurchasesState {
  /** By publication id. */
  purchases: Partial<Record<string, PendingPurchase>>
  start: (publicationId: string, purchase: PendingPurchase) => void
  finish: (publicationId: string) => void
}

/**
 * The purchases of publications started and not settled yet, kept above the screens: the payment
 * is followed to its end whatever note or screen the reader opens meanwhile (B65), by
 * `usePurchaseFollowUp`, which the app shell mounts once.
 */
export const usePendingPurchases = create<PendingPurchasesState>()((set) => ({
  purchases: {},
  start: (publicationId, purchase) =>
    set((state) => ({ purchases: { ...state.purchases, [publicationId]: purchase } })),
  finish: (publicationId) =>
    set((state) => {
      const purchases = { ...state.purchases }
      delete purchases[publicationId]
      return { purchases }
    }),
}))
