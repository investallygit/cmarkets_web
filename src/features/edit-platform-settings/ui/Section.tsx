import type { ReactNode } from 'react'

/** A part of an ADMCFG form, under its amber title. */
export function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-b p-3 last:border-b-0">
      {typeof title === 'string' ? <SectionTitle>{title}</SectionTitle> : title}
      {children}
    </section>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-sans text-title font-semibold tracking-title text-accent-amber uppercase">
      {children}
    </h3>
  )
}
