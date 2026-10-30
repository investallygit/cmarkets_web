import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/**
 * The URL search parameters, and a function that changes them without adding a history entry.
 * The change starts from the parameters of the address bar, which the router updates before React
 * renders: two changes in a row (two filters) both stay, where useSearchParams would keep only the
 * second one.
 */
export function useSearchParamsUpdate() {
  const [searchParams, setSearchParams] = useSearchParams()
  const update = useCallback(
    (change: (current: URLSearchParams) => URLSearchParams) =>
      setSearchParams(change(new URLSearchParams(window.location.search)), { replace: true }),
    [setSearchParams],
  )
  return [searchParams, update] as const
}

/** Sets the given parameters and removes those given empty; the others stay. */
export function withParams(
  params: URLSearchParams,
  values: Partial<Record<string, string>>,
): URLSearchParams {
  const next = new URLSearchParams(params)
  for (const [key, value] of Object.entries(values)) {
    if (value) next.set(key, value)
    else if (value !== undefined) next.delete(key)
  }
  return next
}
