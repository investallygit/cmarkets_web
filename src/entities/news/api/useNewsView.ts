import { useEffect } from 'react'
import { contentApi } from '@/shared/api/endpoints'

/** The content shows this long in an active tab before it counts (spec section 16). */
export const VIEW_AFTER_MS = 3_000

/** The items whose view this tab sent: the server ignores a second one, so none is sent. */
const sent = new Set<string>()

/**
 * The unique click of a news item (spec section 16): once its content has shown 3 seconds in an
 * active tab, POST /news/{id}/view, once. The time counts while the tab is visible only; a hidden
 * tab pauses it, and leaving the content before stops it. Prefetching, the feed's headline or a
 * card do not count: only the component that shows the content calls it.
 */
export function useNewsView(newsId: string | null | undefined) {
  useEffect(() => {
    if (!newsId || sent.has(newsId)) return
    let shown = 0
    let since: number | null = null
    let timer: number | undefined

    const send = () => {
      if (sent.has(newsId)) return
      sent.add(newsId)
      // Always 204; a request that failed may go again the next time the content shows.
      void contentApi.newsView(newsId).catch(() => sent.delete(newsId))
    }
    const resume = () => {
      since = performance.now()
      timer = window.setTimeout(send, Math.max(0, VIEW_AFTER_MS - shown))
    }
    const pause = () => {
      if (since !== null) shown += performance.now() - since
      since = null
      window.clearTimeout(timer)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') resume()
      else pause()
    }

    if (document.visibilityState === 'visible') resume()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [newsId])
}

/** Tests start each case with no view sent. */
export function forgetNewsViews() {
  sent.clear()
}
