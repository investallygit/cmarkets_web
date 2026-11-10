import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { studioKeys, useSaveProviderNews } from '@/entities/news'
import { isApiError } from '@/shared/api'
import type { ProviderNewsDto } from '@/shared/api/contracts'
import { providerApi } from '@/shared/api/endpoints'
import { toast } from '@/shared/ui/toast'
import { limitIssues, toWriteDto } from './newsForm'
import {
  autosaves,
  isNewsDirty,
  isNewsEditable,
  useNewsDraftStore,
  type NewsDraft,
} from './newsDraftStore'

/** One save at a time: each one starts from the version the previous one got. */
let queue: Promise<boolean> = Promise.resolve(true)

interface SaveOptions {
  /** The draft just left for another item: saved though it is no longer open. */
  left?: NewsDraft
  /** Schedule or Update pressed: a scheduled or published item's changes go too. */
  force?: boolean
}

/**
 * Saves the working copy's changes (PUT /provider/news/{id}): a draft's as they are written, a
 * scheduled or published item's when asked. Resolves to false when a limit is passed, the server
 * refused them, or someone saved meanwhile (409).
 */
export function useSaveNews() {
  const { t } = useTranslation()
  const { mutateAsync } = useSaveProviderNews()

  return useCallback(
    ({ left, force = false }: SaveOptions = {}): Promise<boolean> => {
      const run = async () => {
        const current = useNewsDraftStore.getState().draft
        const draft = left && left.newsId !== current?.newsId ? left : current
        if (!draft || !isNewsEditable(draft) || !isNewsDirty(draft)) return true
        if (!force && !autosaves(draft)) return true
        if (draft.failure === 'conflict') return false
        if (!force && draft.failedEdits === draft.edits) return false
        if (Object.keys(limitIssues(draft.form)).length > 0) return false

        const { newsId: id, edits } = draft
        useNewsDraftStore.getState().setSaving(id, true)
        try {
          const saved = await mutateAsync({ id, news: toWriteDto(draft.form, draft.version) })
          useNewsDraftStore.getState().saved(id, saved, edits)
          return true
        } catch (error) {
          const failure = isApiError(error, 409)
            ? 'conflict'
            : isApiError(error, 400)
              ? 'invalid'
              : 'failed'
          useNewsDraftStore
            .getState()
            .failed(id, failure, isApiError(error) ? error.problem.errors : undefined)
          // The item left behind is no longer on screen to say so.
          if (useNewsDraftStore.getState().draft?.newsId !== id) {
            toast.error(t('newsStudio.save.leftUnsaved', { title: draft.form.headline || id }))
          }
          return false
        }
      }
      queue = queue.then(run, run)
      return queue
    },
    [mutateAsync, t],
  )
}

/** After a 409: the copy saved elsewhere replaces the working copy. */
export function useReloadNews() {
  const queryClient = useQueryClient()
  return useCallback(
    async (newsId: string) => {
      const fresh: ProviderNewsDto = await queryClient.fetchQuery({
        queryKey: studioKeys.item(newsId),
        queryFn: ({ signal }) => providerApi.news(newsId, signal),
        staleTime: 0,
      })
      useNewsDraftStore.getState().open(fresh)
    },
    [queryClient],
  )
}
