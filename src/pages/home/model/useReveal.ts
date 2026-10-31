import { useRef } from 'react'
import { useInView } from '@/shared/lib/useInView'

/**
 * Props of a block whose `.reveal` children fade in and rise once it scrolls into view
 * (app/styles: the .reveal class).
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const shown = useInView(ref, { once: true, rootMargin: '0px 0px -10% 0px' })
  return { ref, 'data-reveal': '', 'data-shown': shown ? '' : undefined }
}
