/** A security or an index drawn with the price for comparison (spec section 3). */
export interface ComparedItem {
  kind: 'security' | 'index'
  /** Security id or index code. */
  id: string
  label: string
}

/** Colours left free by the price series and the moving averages, one per compared line. */
export const COMPARISON_COLORS = ['--warning', '--text-primary', '--accent-amber'] as const

export const MAX_COMPARISONS = COMPARISON_COLORS.length

export const comparedKey = (item: ComparedItem) => `${item.kind}:${item.id}`
