import { useEffect, useState, type RefObject } from 'react'

interface InViewOptions {
  /** Stays true once the element has been seen, for an entrance that runs once. */
  once?: boolean
  /** Grows or shrinks the viewport, e.g. '0px 0px -10% 0px' to wait until it is well in. */
  rootMargin?: string
}

/**
 * Whether the element is in the viewport, including inside a scrolling container. Without
 * IntersectionObserver (tests), everything counts as seen.
 */
export function useInView(
  ref: RefObject<Element | null>,
  { once = false, rootMargin }: InViewOptions = {},
): boolean {
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting && once) observer.disconnect()
      },
      { rootMargin },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, once, rootMargin])

  return inView
}
