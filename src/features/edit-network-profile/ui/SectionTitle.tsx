import type { ReactNode } from 'react'

/** A part of a panel, in amber capitals: "EXPERIENCE AND CERTIFICATIONS", "WHO CAN CONTACT ME". */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-sans text-title font-semibold tracking-title text-accent-amber uppercase">
      {children}
    </h3>
  )
}
