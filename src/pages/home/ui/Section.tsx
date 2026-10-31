import { clsx } from 'clsx'
import { Check } from 'lucide-react'
import { useId, type ReactNode } from 'react'

/** The width of the page's content, with a 16 px margin on a phone. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx('mx-auto w-full max-w-[1200px] px-4 sm:px-6', className)}>{children}</div>
  )
}

interface SectionProps {
  /** Anchor of the header's links. */
  id?: string
  eyebrow: string
  title: string
  lead?: string
  children: ReactNode
}

/** A section of the home page: a small green label, the title and its lead, then the content. */
export function Section({ id, eyebrow, title, lead, children }: SectionProps) {
  const headingId = useId()
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-14 py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <header className="flex max-w-3xl flex-col gap-3">
          <p className="font-mono text-data tracking-title text-brand-green uppercase">{eyebrow}</p>
          <h2 id={headingId} className="font-sans text-headline font-bold">
            {title}
          </h2>
          {lead && <p className="font-sans text-lead text-primary/75">{lead}</p>}
        </header>
        {children}
      </Container>
    </section>
  )
}

/** One point of a card, ticked in the brand green. */
export function Point({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2 font-sans text-label text-primary/85">
      <Check aria-hidden className="mt-px size-4 shrink-0 text-brand-green" />
      {children}
    </li>
  )
}
