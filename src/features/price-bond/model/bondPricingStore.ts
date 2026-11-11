import { create } from 'zustand'
import type { BondPriceRequestDto } from '@/shared/api/contracts'
import { toRequest, type Characteristic, type PricingForm } from './pricingForm'

interface BondPricingState {
  /** The bond of the address the form was filled from: another bond fills it again. */
  seededFrom: string | null
  form: PricingForm | null
  /** The inputs of the figures shown, sent by Calculate. */
  submitted: BondPriceRequestDto | null
  /** Fills the form from a bond of the list, and calculates. */
  seed: (bondId: string, form: PricingForm) => void
  /** The settlement, the yield or the face amount: the bond stays the one of the list. */
  edit: (change: Partial<Omit<PricingForm, Characteristic | 'bondId'>>) => void
  /** A characteristic of block A: the bond becomes one entered by hand. */
  editCharacteristics: (change: Partial<Pick<PricingForm, Characteristic>>) => void
  calculate: () => void
}

/** Lives outside the page, so the inputs and the figures survive a visit to another screen. */
export const useBondPricingStore = create<BondPricingState>()((set, get) => ({
  seededFrom: null,
  form: null,
  submitted: null,
  seed: (bondId, form) => set({ seededFrom: bondId, form, submitted: toRequest(form) }),
  edit: (change) => {
    const form = get().form
    if (form) set({ form: { ...form, ...change } })
  },
  editCharacteristics: (change) => {
    const form = get().form
    if (form) set({ form: { ...form, ...change, bondId: null } })
  },
  calculate: () => {
    const form = get().form
    if (form) set({ submitted: toRequest(form) })
  },
}))
