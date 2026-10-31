import { useEffect, useState } from 'react'

const DURATION_MS = 450

/**
 * A number that glides to its new value, e.g. a price when the billing cycle changes; it jumps
 * when `enabled` is false (less motion asked for).
 */
export function useTweenedNumber(target: number, enabled: boolean): number {
  const [previous, setPrevious] = useState(target)
  const [value, setValue] = useState(target)
  const [glide, setGlide] = useState<{ from: number; to: number } | null>(null)

  if (target !== previous) {
    // From the number on screen: midway through a glide, or the previous target.
    const from = glide ? value : previous
    setPrevious(target)
    setValue(from)
    setGlide(enabled ? { from, to: target } : null)
  }

  useEffect(() => {
    if (!glide) return
    const start = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const progress = Math.min(1, (now - start) / DURATION_MS)
      setValue(glide.from + (glide.to - glide.from) * (1 - (1 - progress) ** 3))
      if (progress < 1) frame = requestAnimationFrame(step)
      else setGlide(null)
    })
    return () => cancelAnimationFrame(frame)
  }, [glide])

  return glide ? value : target
}
