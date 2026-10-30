import { useEffect } from 'react'
import type { PublicationDto } from '@/shared/api/contracts'
import { isDirty, isEditable, useDraftStore } from './draftStore'
import { useSaveDraft } from './useSaveDraft'

/** Spec section 9, screen 7: "Autosave every 10 seconds". */
export const AUTOSAVE_MS = 10_000

/**
 * Mounted once by the studio: opens the publication chosen, saves every 10 seconds and when the
 * user leaves for another publication or another screen, and asks before a tab with unsaved
 * changes is closed.
 */
export function useDraftAutosave(publication: PublicationDto | undefined) {
  const save = useSaveDraft()
  const openId = useDraftStore((state) => state.draft?.publicationId)

  useEffect(() => {
    if (!publication || publication.id === openId) return
    const left = useDraftStore.getState().draft
    useDraftStore.getState().open(publication)
    if (left) void save(left)
  }, [publication, openId, save])

  useEffect(() => {
    const timer = window.setInterval(() => void save(), AUTOSAVE_MS)
    return () => {
      window.clearInterval(timer)
      void save()
    }
  }, [save])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      const draft = useDraftStore.getState().draft
      if (draft && isEditable(draft) && isDirty(draft)) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])
}
