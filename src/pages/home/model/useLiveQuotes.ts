import { useEffect, useState } from 'react'
import { tickValues, type SampleQuote } from '../lib/liveQuotes'

const BEAT_MS = 1400

/** The values of sample quotes, moving at each beat while `running`. */
export function useLiveQuotes(samples: readonly SampleQuote[], running: boolean): number[] {
  const [values, setValues] = useState(() => samples.map((sample) => sample.value))

  useEffect(() => {
    if (!running) return
    const timer = setInterval(
      () => setValues((current) => tickValues(current, samples, Math.random)),
      BEAT_MS,
    )
    return () => clearInterval(timer)
  }, [samples, running])

  return values
}
