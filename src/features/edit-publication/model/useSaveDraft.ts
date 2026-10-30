import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  publicationQueryOptions,
  usePublicationRules,
  useSavePricing,
  useSavePublication,
} from '@/entities/publication'
import { isApiError } from '@/shared/api'
import type { PublicationDto } from '@/shared/api/contracts'
import { toast } from '@/shared/ui/toast'
import { hasIssues, pricingIssues, toPricingDto, toUpdateDto } from './draftForm'
import { isDirty, isEditable, useDraftStore, type Draft } from './draftStore'

/** One save at a time: each one starts from the row version the previous one got. */
let queue: Promise<boolean> = Promise.resolve(true)

/**
 * Saves the draft's changes: PUT /publications/{id}, then PUT .../pricing once the prices are
 * valid. Resolves to false when the server refused them or someone saved meanwhile (409).
 * Given the draft just left for another publication, saves that one.
 */
export function useSaveDraft() {
  const { t } = useTranslation()
  const { mutateAsync: saveContent } = useSavePublication()
  const { mutateAsync: savePricing } = useSavePricing()
  const rules = usePublicationRules().data

  return useCallback(
    (left?: Draft): Promise<boolean> => {
      const run = async () => {
        const current = useDraftStore.getState().draft
        const draft = left && left.publicationId !== current?.publicationId ? left : current
        if (!draft || !isEditable(draft) || !isDirty(draft)) return true
        if (draft.failure === 'conflict') return false
        if (draft.failedEdits === draft.contentEdits + draft.pricingEdits) return false
        const { publicationId: id, contentEdits, pricingEdits } = draft
        const sendContent = contentEdits !== draft.savedContentEdits
        const sendPricing =
          pricingEdits !== draft.savedPricingEdits &&
          rules !== undefined &&
          !hasIssues(
            pricingIssues(draft.pricing, rules, {
              access: draft.savedAccess,
              readFree: draft.readFree,
            }),
          )
        if (!sendContent && !sendPricing) return true

        useDraftStore.getState().setSaving(id, true)
        try {
          let saved: PublicationDto | undefined
          let version = draft.version
          if (sendContent) {
            saved = await saveContent({ id, input: toUpdateDto(draft.form, version) })
            version = saved.version
          }
          if (sendPricing)
            saved = await savePricing({ id, input: toPricingDto(draft.pricing, version) })
          if (saved) {
            useDraftStore.getState().saved(id, saved, {
              content: sendContent ? contentEdits : undefined,
              pricing: sendPricing ? pricingEdits : undefined,
            })
          }
          return true
        } catch (error) {
          const failure = isApiError(error, 409)
            ? 'conflict'
            : isApiError(error, 400)
              ? 'invalid'
              : 'failed'
          useDraftStore
            .getState()
            .failed(id, failure, isApiError(error) ? error.problem.errors : undefined)
          // The publication left behind is no longer on screen to say so.
          if (useDraftStore.getState().draft?.publicationId !== id) {
            toast.error(t('studio.save.leftUnsaved', { title: draft.form.title || id }))
          }
          return false
        }
      }
      queue = queue.then(run, run)
      return queue
    },
    [saveContent, savePricing, rules, t],
  )
}

/** After a 409: the copy saved elsewhere replaces the draft. */
export function useReloadDraft() {
  const queryClient = useQueryClient()
  return useCallback(
    async (publicationId: string) => {
      const fresh = await queryClient.fetchQuery({
        ...publicationQueryOptions(publicationId),
        staleTime: 0,
      })
      useDraftStore.getState().open(fresh)
    },
    [queryClient],
  )
}
