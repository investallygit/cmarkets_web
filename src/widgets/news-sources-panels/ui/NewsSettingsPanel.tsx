import { useTranslation } from 'react-i18next'
import { useNewsSettings } from '@/entities/news-source'
import { NewsSettingsForm } from '@/features/edit-news-settings'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/** SRC, CMarket AI and the unique clicks: the AI's review mode and threshold, the views an hour. */
export function NewsSettingsPanel() {
  const { t } = useTranslation()
  const settings = useNewsSettings()
  return (
    <Panel title={t('panels.newsSettings')} code="SRC">
      <QueryView query={settings}>
        {(found) => <NewsSettingsForm key={JSON.stringify(found)} settings={found} />}
      </QueryView>
    </Panel>
  )
}
