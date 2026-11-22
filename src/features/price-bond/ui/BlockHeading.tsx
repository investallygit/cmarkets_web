import type { ReactNode } from 'react'

/** "A. Bond characteristics", "B. Discount rates": the blocks of the inputs. */
export function BlockHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="pt-1 font-mono text-label font-semibold tracking-title text-accent-amber uppercase">
      {children}
    </h3>
  )
}
