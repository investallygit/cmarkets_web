import { useEffect } from 'react'
import type { ProviderNewsDto } from '@/shared/api/contracts'
import { autosaves, isNewsDirty, isNewsEditable, useNewsDraftStore } from './newsDraftStore'
import { useSaveNews } from './useSaveNews'

/** A draft saves every 10 seconds, as PUB NEW's (spec section 9, screen 7). */
export const AUTOSAVE_MS = 10_000

/**
 * Mounted once by the studio: opens the item chosen, follows its server copy, saves a draft every
 * 10 seconds and when the user leaves for another item or another screen, and asks before a tab
 * with unsaved changes is closed.
 */
export function useNewsAutosave(item: ProviderNewsDto | undefined) {
  const save = useSaveNews()
  const openId = useNewsDraftStore((state) => state.draft?.newsId)

  useEffect(() => {
    if (!item) return
    if (item.id === openId) {
      useNewsDraftStore.getState().refresh(item)
      return
    }
    const left = useNewsDraftStore.getState().draft
    useNewsDraftStore.getState().open(item)
    if (left) void save({ left })
  }, [item, openId, save])

  useEffect(() => {
    const timer = window.setInterval(() => void save(), AUTOSAVE_MS)
    return () => {
      window.clearInterval(timer)
      void save()
    }
  }, [save])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      const draft = useNewsDraftStore.getState().draft
      if (draft && isNewsEditable(draft) && isNewsDirty(draft)) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])
}

/** The studio closes: the next one opens its item afresh. */
export function closeNewsDraft() {
  useNewsDraftStore.setState({ draft: null })
}

export { autosaves }
