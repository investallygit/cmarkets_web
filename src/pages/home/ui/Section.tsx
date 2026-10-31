import { clsx } from 'clsx'
import { Check } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import type { PhotoFiles } from '../config/photos'
import { useReveal } from '../model/useReveal'
import { PhotoBackdrop } from './HomeBackground'

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
  /** A photo across the page above the title, which then stands on its shaded lower part. */
  photo?: PhotoFiles
  children: ReactNode
}

/**
 * A section of the home page: a small green label, the title and its lead, then the content. Its
 * blocks marked `reveal` come in once it scrolls into view.
 */
export function Section({ id, eyebrow, title, lead, photo, children }: SectionProps) {
  const headingId = useId()
  const reveal = useReveal<HTMLElement>()
  return (
    <section
      {...reveal}
      id={id}
      aria-labelledby={headingId}
      className={clsx(
        'relative isolate scroll-mt-14 py-16 sm:py-20',
        // The title at two thirds of the photo's height, where its shade is dark enough.
        photo && 'pt-72 sm:pt-100',
      )}
    >
      {photo && <PhotoBackdrop photo={photo} under="text" className="top-0 h-104 sm:h-152" />}
      <Container className="flex flex-col gap-10">
        <header className="reveal flex max-w-3xl flex-col gap-3">
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
