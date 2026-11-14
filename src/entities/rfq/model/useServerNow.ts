import { useEffect, useState } from 'react'
import { serverNow } from '@/shared/lib/serverClock'

/**
 * The server's time, ticking each second while `active`: the countdowns of screen 22 (a request's
 * time left, an answer's validity) follow the clock that closes them, not the user's.
 */
export function useServerNow(active = true): number {
  const [now, setNow] = useState(serverNow)
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => setNow(serverNow()), 1000)
    return () => window.clearInterval(timer)
  }, [active])
  return now
}
