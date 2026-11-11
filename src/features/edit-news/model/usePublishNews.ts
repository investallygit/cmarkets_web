import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePublishProviderNews, useProviderSource } from '@/entities/news'
import { isApiError } from '@/shared/api'
import { formatDate, formatTime } from '@/shared/lib/format'
import { toast } from '@/shared/ui/toast'
import { doualaIso, publishNeeds } from './newsForm'
import { useNewsDraftStore } from './newsDraftStore'
import { useSaveNews } from './useSaveNews'

/**
 * Publish, Schedule or Update (spec section 16): the changes saved first, then a draft or a
 * scheduled item goes live now or at its time of Douala, the rights certified; a published item's
 * changes show at once with "Updated on …".
 */
export function usePublishNews() {
  const { t } = useTranslation()
  const save = useSaveNews()
  const { mutateAsync } = usePublishProviderNews()
  const source = useProviderSource().data
  const [pending, setPending] = useState(false)

  const publish = async () => {
    const store = useNewsDraftStore.getState()
    const draft = store.draft
    if (!draft || pending) return
    store.check(draft.newsId)
    const scheduled = draft.goLive.mode === 'scheduled'
    const needs = publishNeeds(draft.form, {
      rightsConfirmed: draft.rightsConfirmed,
      schedule: scheduled && draft.item.status !== 'published' ? draft.goLive : null,
      now: new Date(),
    })
    if (needs.length > 0) return
    setPending(true)
    try {
      if (!(await save({ force: true }))) return
      const current = useNewsDraftStore.getState().draft
      if (!current || current.newsId !== draft.newsId) return
      if (current.item.status === 'published') {
        toast.success(t('newsStudio.publishing.updated'))
        return
      }
      const publishAt = scheduled ? doualaIso(current.goLive.date, current.goLive.time) : null
      try {
        const item = await mutateAsync({
          id: current.newsId,
          publication: { publishAt, rightsConfirmed: true, version: current.version },
        })
        useNewsDraftStore.getState().saved(current.newsId, item)
        toast.success(
          item.status === 'pending'
            ? t('newsStudio.publishing.sentForReview')
            : item.status === 'scheduled' && item.publishAt
              ? t('newsStudio.publishing.scheduledFor', {
                  when: t('newsStudio.publishing.when', {
                    // The schedule is a time of Douala, whatever the profile's time zone.
                    date: formatDate(item.publishAt),
                    time: formatTime(item.publishAt),
                  }),
                })
              : t('newsStudio.publishing.published'),
        )
      } catch (error) {
        if (isApiError(error, 409) && error.problem.title === 'FLASH quota reached') {
          toast.error(t('newsStudio.publishing.quota', { quota: source?.flashQuota ?? 20 }))
        } else if (isApiError(error, 400)) {
          useNewsDraftStore.getState().failed(current.newsId, 'invalid', error.problem.errors)
        } else if (isApiError(error, 409)) {
          useNewsDraftStore.getState().failed(current.newsId, 'conflict')
        } else {
          toast.error(error instanceof Error ? error.message : String(error))
        }
      }
    } finally {
      setPending(false)
    }
  }

  return { publish, pending }
}
