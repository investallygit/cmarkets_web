import { useTranslation } from 'react-i18next'
import { useProviderNews } from '@/entities/news'
import { NewsPublishing, WithdrawNewsButton } from '@/features/edit-news'
import { Panel } from '@/shared/ui/Panel'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { QueryView } from '@/shared/ui/QueryView'

/**
 * Screen 13, right, top: the item's category, countries, securities, language, type and time to
 * go live; Preview and Publish or Schedule; Withdraw in its title bar. API POST
 * /provider/news/{id}/publish and /withdraw.
 */
export function NewsPublishingPanel({ newsId }: { newsId: string | null }) {
  const { t } = useTranslation()
  const item = useProviderNews(newsId)
  return (
    <Panel title={t('panels.publishing')} code="NEWS" options={item.data && <WithdrawNewsButton />}>
      {newsId === null ? (
        <PanelEmpty message={t('newsStudio.mine.choose')} />
      ) : (
        <QueryView query={item}>{() => <NewsPublishing />}</QueryView>
      )}
    </Panel>
  )
}
