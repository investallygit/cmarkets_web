import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'
import { toMarketDay } from '@/shared/lib/format'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { isDirty, isEditable, useDraftStore } from '../model/draftStore'
import { useReloadDraft } from '../model/useSaveDraft'

/** "SAVED AT 10:41" in the editor's title bar, or why it is not saved. */
export function SaveStatus() {
  const { t } = useTranslation()
  const format = useFormat()
  const today = useMarketDay()
  const draft = useDraftStore((state) => state.draft)
  const reload = useReloadDraft()
  if (!draft) return null

  if (draft.failure === 'conflict') {
    return (
      <span role="alert" className="panel-no-drag flex items-center gap-1.5 text-down">
        {t('studio.save.conflict')}
        <button
          type="button"
          onClick={() => void reload(draft.publicationId)}
          className="uppercase underline hover:text-primary"
        >
          {t('studio.save.reload')}
        </button>
      </span>
    )
  }
  const dirty = isEditable(draft) && isDirty(draft)
  let text: string
  if (draft.saving) text = t('studio.save.saving')
  else if (dirty && draft.failure === 'failed') text = t('studio.save.failed')
  else if (dirty && draft.failure === 'invalid') text = t('studio.save.invalid')
  else if (dirty) text = t('studio.save.unsaved')
  else {
    const time = format.time(draft.savedAt)
    text =
      toMarketDay(draft.savedAt) === today
        ? t('studio.save.savedAt', { time })
        : t('studio.save.savedOn', { date: format.dayMonth(draft.savedAt), time })
  }
  return (
    <span role="status" className={dirty && draft.failure ? 'text-down' : undefined}>
      {text}
    </span>
  )
}
