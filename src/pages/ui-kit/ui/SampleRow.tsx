import type { ReactNode } from 'react'

/** A labelled row of samples. */
export function SampleRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3">
      <span className="font-sans text-data text-secondary">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}
