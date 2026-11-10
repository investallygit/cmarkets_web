import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'
import { toMarketDay } from '@/shared/lib/format'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { autosaves, isNewsDirty, isNewsEditable, useNewsDraftStore } from '../model/newsDraftStore'
import { useReloadNews } from '../model/useSaveNews'

/** "SAVED AT 07:58" in the editor's title bar, or why it is not saved. */
export function NewsSaveStatus() {
  const { t } = useTranslation()
  const format = useFormat()
  const today = useMarketDay()
  const draft = useNewsDraftStore((state) => state.draft)
  const reload = useReloadNews()
  if (!draft) return null

  if (draft.failure === 'conflict') {
    return (
      <span role="alert" className="panel-no-drag flex items-center gap-1.5 text-down">
        {t('newsStudio.save.conflict')}
        <button
          type="button"
          onClick={() => void reload(draft.newsId)}
          className="uppercase underline hover:text-primary"
        >
          {t('newsStudio.save.reload')}
        </button>
      </span>
    )
  }
  const dirty = isNewsEditable(draft) && isNewsDirty(draft)
  let text: string
  if (draft.saving) text = t('newsStudio.save.saving')
  else if (dirty && draft.failure === 'failed') text = t('newsStudio.save.failed')
  else if (dirty && draft.failure === 'invalid') text = t('newsStudio.save.invalid')
  else if (dirty)
    text = autosaves(draft) ? t('newsStudio.save.unsaved') : t('newsStudio.save.pending')
  else {
    const time = format.time(draft.savedAt)
    text =
      toMarketDay(draft.savedAt) === today
        ? t('newsStudio.save.savedAt', { time })
        : t('newsStudio.save.savedOn', { date: format.dayMonth(draft.savedAt), time })
  }
  return (
    <span role="status" className={dirty && draft.failure ? 'text-down' : undefined}>
      {text}
    </span>
  )
}
