import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'
import type { ProfileEditor } from '../model/useProfileEditor'

/** "Saved at 10:41" in the title bar, or that changes wait for SAVE. */
export function SaveState({ editor }: { editor: ProfileEditor }) {
  const { t } = useTranslation()
  const format = useFormat()
  const { updatedAt } = editor.profile
  if (editor.dirty) return <span className="text-accent-amber">{t('network.notSaved')}</span>
  return (
    <span>
      {updatedAt ? t('network.savedAt', { time: format.time(updatedAt) }) : t('network.neverSaved')}
    </span>
  )
}
